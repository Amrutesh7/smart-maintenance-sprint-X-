# backend/ml/update_future_risk.py
"""
Run this script to refresh ML-based future risk predictions.

Usage:

  cd backend
  python ml/update_future_risk.py

It will:

1. Load recent incidents from Supabase.
2. Use predict_advanced.predict(...) to get ML scores per incident.
3. Aggregate by (building, category) to compute a risk_score and risk_label.
4. Wipe and refill the incident_risk table.
"""

import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from supabase import create_client, Client
import pandas as pd

# 👉 comes from your friend's folder
from predict_advanced import predict  # must be in the same "ml" folder

# =================== ENV + SUPABASE SETUP ===================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# load .env from backend/
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env for ML script"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# =================== DATA LOADING ===================

def load_incidents_df(days: int = 60) -> pd.DataFrame:
    """
    Load incidents from the last `days` days from Supabase into a DataFrame.
    Uses the new Supabase client (no .error attribute).
    """
    print("Loading incidents from Supabase...")
    since = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"

    try:
        resp = (
            supabase.table("incidents")
            .select("id, title, description, category, building, created_at")
            .gte("created_at", since)
            .execute()
        )
    except Exception as e:
        print("❌ Error fetching incidents from Supabase:", e)
        return pd.DataFrame()

    rows = resp.data or []
    if not rows:
        print(f"⚠️ No incidents found in the last {days} days.")
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
    df = df.dropna(subset=["building", "category", "created_at"])

    print(f"✅ Loaded {len(df)} incidents.")
    return df


# =================== ML SCORING PER INCIDENT ===================

def score_incidents_with_ml(df: pd.DataFrame) -> pd.DataFrame:
    """
    Call predict_advanced.predict for each incident and build a prediction DataFrame.
    """
    if df.empty:
        return pd.DataFrame()

    df = df.copy()
    df["hour_of_day"] = df["created_at"].dt.hour
    df["day_of_week"] = df["created_at"].dt.weekday

    preds = []

    for _, row in df.iterrows():
        payload = {
            "title": (row.get("title") or "")[:200],
            "description": (row.get("description") or "")[:500],
            "category": (row.get("category") or "other"),
            "building": (row.get("building") or "Unknown"),
            "hour_of_day": int(row["hour_of_day"]),
            "day_of_week": int(row["day_of_week"]),
        }

        try:
            result = predict(payload)
        except Exception as e:
            print(f"❌ Error calling predict() for incident id={row.get('id')}: {e}")
            continue

        priority = str(result.get("pred_priority", "low")).lower()
        sla_minutes = float(result.get("sla_minutes", 120))
        breach_prob = float(result.get("sla_breach_prob", 0.0))

        # Map priority -> numeric severity
        if priority == "high":
            sev = 1.0
        elif priority == "medium":
            sev = 0.6
        else:
            sev = 0.3

        preds.append(
            {
                "id": row.get("id"),
                "building": payload["building"],
                "category": payload["category"],
                "priority": priority,
                "sla_minutes": sla_minutes,
                "sla_breach_prob": breach_prob,
                "severity": sev,
            }
        )

    pred_df = pd.DataFrame(preds)
    print(f"✅ ML predictions computed for {len(pred_df)} incidents.")
    return pred_df


# =================== AGGREGATE TO BUILDING + CATEGORY RISK ===================

def make_risk_rows(pred_df: pd.DataFrame) -> list[dict]:
    """
    Aggregate per-incident ML scores to (building, category) risk rows.
    risk_score is in [0,1] and risk_label is low/medium/high.
    """
    if pred_df.empty:
        return []

    grouped = pred_df.groupby(["building", "category"])
    rows = []
    now_iso = datetime.utcnow().isoformat() + "Z"

    for (building, category), g in grouped:
        count = len(g)
        sev_mean = float(g["severity"].mean())
        breach_mean = float(g["sla_breach_prob"].mean())

        # Combine severity + breach probability
        risk_score = 0.6 * sev_mean + 0.4 * breach_mean

        # Boost a bit if there are many incidents
        if count >= 5:
            risk_score += 0.10
        elif count >= 3:
            risk_score += 0.05

        # Clamp to [0, 1]
        risk_score = max(0.0, min(1.0, risk_score))

        if risk_score >= 0.75:
            label = "high"
        elif risk_score >= 0.45:
            label = "medium"
        else:
            label = "low"

        rows.append(
            {
                "building": building,
                "category": category,
                "risk_score": risk_score,
                "risk_label": label,
                "incident_count": int(count),
                "generated_at": now_iso,
            }
        )

    # Sort descending by risk_score so frontend top rows look most critical
    rows.sort(key=lambda r: r["risk_score"], reverse=True)
    print(f"✅ Built {len(rows)} building/category risk rows.")
    return rows


# =================== WRITE BACK TO SUPABASE ===================

def clear_incident_risk_table():
    """Delete existing rows from incident_risk (best-effort)."""
    print("🧹 Clearing old rows from incident_risk...")
    try:
        # PostgREST requires a filter; id != 0 effectively deletes all rows.
        supabase.table("incident_risk").delete().neq("id", 0).execute()
        print("✅ Cleared old risk rows.")
    except Exception as e:
        print("⚠️ Warning: error while clearing incident_risk:", e)


def insert_risk_rows(rows: list[dict]):
    if not rows:
        print("⚠️ No risk rows to insert.")
        return

    print(f"💾 Inserting {len(rows)} rows into incident_risk...")
    try:
        supabase.table("incident_risk").insert(rows).execute()
        print("✅ Inserted risk rows into incident_risk.")
    except Exception as e:
        print("❌ Error inserting rows into incident_risk:", e)


# =================== MAIN ===================

def main():
    df = load_incidents_df(days=60)
    if df.empty:
        print("⚠️ Not enough incidents to compute ML risk. Exiting.")
        return

    pred_df = score_incidents_with_ml(df)
    if pred_df.empty:
        print("⚠️ Prediction DataFrame empty. Exiting.")
        return

    rows = make_risk_rows(pred_df)
    if not rows:
        print("⚠️ No risk rows generated. Exiting.")
        return

    clear_incident_risk_table()
    insert_risk_rows(rows)


if __name__ == "__main__":
    main()
