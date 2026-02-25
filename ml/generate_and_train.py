"""
Gambling Addiction Relapse Predictor — ML Pipeline
====================================================
Dataset: synthetic, based on published research:
  - Blaszczynski & Nower (2002) — Pathways model of gambling
  - Potenza et al. (2019) — Neuroscience of gambling disorder
  - Fortune & Goodie (2012) — Cognitive biases in gambling

Features:
  streak_days          — consecutive clean days (no gambling)
  episodes_last_7      — gambling episodes in last 7 days
  episodes_prev_7      — gambling episodes in the 7 days before that
  avg_mood_before      — average mood before episodes (1=terrible..5=great)
  night_activity_ratio — fraction of episodes that occurred at night (22:00-06:00)
  trigger_count        — number of distinct triggers reported (0-6)
  financial_escalation — 1 if avg spending increased >20% last week vs prev week
  unlock_attempts_7    — times user tried to access blocked gambling sites (last 7d)
  blocked_sites_7      — distinct blocked domains attempted (last 7d)
  total_episodes_30    — total gambling episodes in last 30 days

Targets:
  days_until_relapse   — regression: days until next gambling episode (1-20)
  relapse_7d           — classification: will relapse within 10 days (0/1)

Model: GradientBoostingRegressor + GradientBoostingClassifier
Export: JSON trees for zero-dependency TypeScript inference
"""

import json
import math
import os
import random
import shutil
import sys
import csv

# ── try sklearn, fallback to pure-Python implementation ──
try:
    import numpy as np
    from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import (
        mean_absolute_error, r2_score,
        roc_auc_score, accuracy_score, classification_report
    )
    USE_SKLEARN = True
    print("OK scikit-learn available - using GradientBoostedTrees")
except ImportError:
    USE_SKLEARN = False
    print("WARN scikit-learn not found - using pure-Python fallback GBM")

random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# DATASET GENERATION
# Based on: Lesieur & Blume SOGS, PGSI scale, and addiction relapse literature
# ─────────────────────────────────────────────────────────────────────────────

N = 10000

def gauss_clamp(mu, sigma, lo, hi):
    """Gaussian sample clamped to [lo, hi]."""
    v = random.gauss(mu, sigma)
    return max(lo, min(hi, v))

def exponential_clamp(scale, lo, hi):
    """Exponential sample clamped to [lo, hi]."""
    v = -scale * math.log(random.random() + 1e-12)
    return max(lo, min(hi, v))

def generate_sample():
    """Generate one synthetic patient record with realistic correlations."""

    # ── Latent severity (0-1): drives many features
    # High severity = frequent relapses, worse outcomes
    severity = random.betavariate(1.5, 2.5)   # right-skewed: most patients moderate

    # ── Time in recovery (days): streak
    # Severity negatively correlated with streak length
    max_streak = max(1, int((1 - severity) * 90 + random.gauss(0, 5)))
    streak_days = int(exponential_clamp(max_streak * 0.5, 0, 90))

    # ── Recent episodes: higher severity → more frequent
    lam_last7 = max(0.1, severity * 5)
    episodes_last_7 = min(7, max(0, int(random.expovariate(1 / lam_last7 + 0.01))))
    lam_prev7 = max(0.1, severity * 4.5 + random.gauss(0, 0.3))
    episodes_prev_7 = min(7, max(0, int(random.expovariate(1 / lam_prev7 + 0.01))))

    # ── Mood: low mood → higher risk (PGSI Item correlation)
    avg_mood_before = round(gauss_clamp(3.0 - severity * 1.5, 0.7, 1.0, 5.0), 2)

    # ── Night activity: late-night gambling = worse outcome (Griffiths 1999)
    night_p = 0.15 + severity * 0.45
    night_activity_ratio = round(random.betavariate(max(0.2, night_p * 2), max(0.2, (1 - night_p) * 2)), 3)

    # ── Triggers: stress, boredom, loneliness, alcohol, ads, other
    trigger_count = min(6, int(random.expovariate(1 / (1 + severity * 4))))

    # ── Financial escalation: spending > 20% more this week vs last
    financial_escalation = 1 if (episodes_last_7 > episodes_prev_7 and
                                   random.random() < 0.3 + severity * 0.4) else 0

    # ── Blocking behavior: more unlock attempts → higher craving
    unlock_mu = severity * 6
    unlock_attempts_7 = min(20, int(max(0, random.expovariate(1 / (unlock_mu + 0.1)))))

    blocked_sites_7 = min(50, max(0, unlock_attempts_7 + int(random.expovariate(0.5))))

    # ── Total 30-day episodes
    total_episodes_30 = min(30, episodes_last_7 + episodes_prev_7 +
                            max(0, int(random.gauss(severity * 8, 3))))

    # ── TARGET: days until next relapse ──
    # Weighted risk score [0..1] → direct mapping to days range
    # Literature: Blaszczynski (2002), Holtgraves (2009) PGSI correlates

    risk_score = (
        0.30 * (episodes_last_7 / 7) +             # strongest predictor: recent episodes
        0.22 * ((5.0 - avg_mood_before) / 4.0) +   # mood dysregulation
        0.16 * night_activity_ratio +               # disordered sleep/gambling
        0.14 * min(unlock_attempts_7 / 8.0, 1) +   # craving & blocking behavior
        0.10 * float(financial_escalation) +         # spending escalation
        0.08 * (trigger_count / 6.0)               # trigger exposure breadth
    )  # 0..1 scale

    protection_score = min(streak_days / 45.0, 1.0)  # 45+ clean days → max protection

    # Net risk: 0 = very safe, 1 = imminent relapse
    net_risk = max(0.0, min(1.0, risk_score * 0.7 - protection_score * 0.3 + 0.2))

    # Days = strong inverse function of net_risk, range 1-20 only
    # At net_risk=0.0: ~20 days;  at net_risk=1.0: ~1 day. Adequate spread 1-20.
    deterministic_days = 20.0 * (1.0 - net_risk) + 1.0
    noise = random.gauss(0, 1.5)
    days_until_relapse = max(1, min(20, int(round(deterministic_days + noise))))

    # ── Secondary target: high risk = relapse within 10 days (1 = yes)
    relapse_7d = 1 if days_until_relapse <= 10 else 0

    return {
        "streak_days": streak_days,
        "episodes_last_7": episodes_last_7,
        "episodes_prev_7": episodes_prev_7,
        "avg_mood_before": avg_mood_before,
        "night_activity_ratio": night_activity_ratio,
        "trigger_count": trigger_count,
        "financial_escalation": financial_escalation,
        "unlock_attempts_7": unlock_attempts_7,
        "blocked_sites_7": blocked_sites_7,
        "total_episodes_30": total_episodes_30,
        "days_until_relapse": days_until_relapse,
        "relapse_soon": relapse_7d,
    }

print("Generating synthetic dataset...")
rows = [generate_sample() for _ in range(N)]
print(f"  Generated {N} samples")

# ── Basic stats ──
relapse_rate = sum(r["relapse_soon"] for r in rows) / N
avg_days = sum(r["days_until_relapse"] for r in rows) / N
print(f"  10-day relapse rate: {relapse_rate:.1%}")
print(f"  Avg days until relapse: {avg_days:.1f}")

# ── Save CSV ──
out_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(out_dir, "gambling_relapse_dataset.csv")
fieldnames = list(rows[0].keys())
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print(f"  Saved -> {csv_path}")

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE NAMES & MATRIX
# ─────────────────────────────────────────────────────────────────────────────

FEATURE_NAMES = [
    "streak_days",
    "episodes_last_7",
    "episodes_prev_7",
    "avg_mood_before",
    "night_activity_ratio",
    "trigger_count",
    "financial_escalation",
    "unlock_attempts_7",
    "blocked_sites_7",
    "total_episodes_30",
]

def rows_to_matrix(data):
    return [[row[f] for f in FEATURE_NAMES] for row in data]

X = rows_to_matrix(rows)
y_reg = [r["days_until_relapse"] for r in rows]
y_cls = [r["relapse_soon"] for r in rows]

# ─────────────────────────────────────────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────────────────────────────────────────

if USE_SKLEARN:
    X_np = np.array(X, dtype=np.float32)
    y_reg_np = np.array(y_reg, dtype=np.float32)
    y_cls_np = np.array(y_cls, dtype=np.int32)

    X_tr, X_te, yr_tr, yr_te, yc_tr, yc_te = train_test_split(
        X_np, y_reg_np, y_cls_np, test_size=0.2, random_state=42
    )

    print("\nTraining GradientBoostingRegressor (days_until_relapse, 1-20 days)...")
    reg = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.85,
        min_samples_leaf=15,
        random_state=42,
        loss="squared_error",
    )
    reg.fit(X_tr, yr_tr)
    yr_pred = reg.predict(X_te)
    mae = mean_absolute_error(yr_te, yr_pred)
    r2 = r2_score(yr_te, yr_pred)
    print(f"  MAE: {mae:.2f} days   R²: {r2:.3f}")

    print("Training GradientBoostingClassifier (relapse within 10d)...")
    clf = GradientBoostingClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        min_samples_leaf=15,
        random_state=42,
    )
    clf.fit(X_tr, yc_tr)
    yc_pred_proba = clf.predict_proba(X_te)[:, 1]
    yc_pred = (yc_pred_proba >= 0.5).astype(int)
    auc = roc_auc_score(yc_te, yc_pred_proba)
    acc = accuracy_score(yc_te, yc_pred)
    print(f"  AUC: {auc:.3f}   Accuracy: {acc:.3f}")
    print(classification_report(yc_te, yc_pred, target_names=["No relapse (10d)", "Relapse (10d)"]))

    # ── Feature importance ──
    fi_reg = {FEATURE_NAMES[i]: float(reg.feature_importances_[i]) for i in range(len(FEATURE_NAMES))}
    fi_cls = {FEATURE_NAMES[i]: float(clf.feature_importances_[i]) for i in range(len(FEATURE_NAMES))}
    print("\nFeature importances (regressor):")
    for k, v in sorted(fi_reg.items(), key=lambda x: -x[1]):
        print(f"  {k:30s}: {v:.4f}")

    # ── Export trees to JSON ──
    # Each GBM tree is a small DecisionTreeRegressor with an internal structure
    def export_tree(tree_obj):
        t = tree_obj.tree_
        return {
            "left_child":  t.children_left.tolist(),
            "right_child": t.children_right.tolist(),
            "feature":     t.feature.tolist(),
            "threshold":   t.threshold.tolist(),
            "value":       t.value[:, 0, 0].tolist(),  # shape (nodes,)
        }

    reg_trees = [export_tree(est[0]) for est in reg.estimators_]
    clf_trees = [export_tree(est[0]) for est in clf.estimators_]

    model_json = {
        "meta": {
            "name": "NoBet GBM Relapse Predictor",
            "version": "2.0.0",
            "algorithm": "Gradient Boosted Trees (scikit-learn)",
            "architecture": f"GBM 150×depth5 + GBM 120×depth4",
            "parameters": sum(
                est[0].tree_.node_count for est in reg.estimators_
            ) + sum(
                est[0].tree_.node_count for est in clf.estimators_
            ),
            "features": FEATURE_NAMES,
            "dataset_size": N,
            "reg_mae_days": round(float(mae), 2),
            "reg_r2": round(float(r2), 4),
            "cls_auc": round(float(auc), 4),
            "cls_acc": round(float(acc), 4),
            "independent": True,
            "externalAPIs": 0,
        },
        "regressor": {
            "init_prediction": float(np.mean(yr_tr)),
            "learning_rate": reg.learning_rate,
            "n_estimators": reg.n_estimators,
            "trees": reg_trees,
        },
        "classifier": {
            "init_log_odds": float(np.log(np.mean(yc_tr) / (1 - np.mean(yc_tr) + 1e-9))),
            "learning_rate": clf.learning_rate,
            "n_estimators": clf.n_estimators,
            "trees": clf_trees,
        },
        "feature_importance": {
            "regressor": fi_reg,
            "classifier": fi_cls,
        },
    }

else:
    # ── Pure-Python fallback: simple Gradient Boosted Stumps ──
    print("\nUsing pure-Python Gradient Boosted Stumps (decision stumps)")

    def mean_(vals):
        return sum(vals) / len(vals) if vals else 0.0

    def mse_gain(left, right):
        n = len(left) + len(right)
        if not left or not right:
            return -1e18
        ml, mr = mean_(left), mean_(right)
        return -(len(left) * sum((v - ml)**2 for v in left) +
                 len(right) * sum((v - mr)**2 for v in right)) / n

    def best_stump(X, residuals):
        n = len(X)
        nf = len(X[0])
        best_gain = -1e18
        best_feat = 0
        best_thresh = 0.0
        best_left_val = 0.0
        best_right_val = 0.0
        for fi in range(nf):
            vals = sorted(set(X[i][fi] for i in range(n)))
            thresholds = [(vals[j] + vals[j+1]) / 2 for j in range(len(vals)-1)]
            for thresh in thresholds:
                l = [residuals[i] for i in range(n) if X[i][fi] <= thresh]
                r = [residuals[i] for i in range(n) if X[i][fi] > thresh]
                gain = mse_gain(l, r)
                if gain > best_gain:
                    best_gain = gain
                    best_feat = fi
                    best_thresh = thresh
                    best_left_val = mean_(l)
                    best_right_val = mean_(r)
        return best_feat, best_thresh, best_left_val, best_right_val

    def predict_stump(stump, x):
        feat, thresh, lv, rv = stump
        return lv if x[feat] <= thresh else rv

    def train_gbm_stumps(X, y, n_estimators=80, lr=0.1):
        preds = [mean_(y)] * len(y)
        init_pred = mean_(y)
        stumps = []
        for t in range(n_estimators):
            residuals = [y[i] - preds[i] for i in range(len(y))]
            feat, thresh, lv, rv = best_stump(X, residuals)
            stumps.append((feat, thresh, lv * lr, rv * lr))
            for i in range(len(preds)):
                preds[i] += predict_stump(stumps[-1], X[i])
            if (t + 1) % 20 == 0:
                print(f"  Iteration {t+1}/{n_estimators}...", end=" ", flush=True)
        print()
        return init_pred, stumps

    # Split 80/20
    n_tr = int(N * 0.8)
    X_tr, X_te = X[:n_tr], X[n_tr:]
    yr_tr, yr_te = y_reg[:n_tr], y_reg[n_tr:]
    yc_tr, yc_te = y_cls[:n_tr], y_cls[n_tr:]

    print("Training regression GBM stumps...")
    reg_init, reg_stumps = train_gbm_stumps(X_tr, yr_tr, n_estimators=80, lr=0.12)

    yr_pred = [reg_init + sum(predict_stump(s, x) for s in reg_stumps) for x in X_te]
    mae = sum(abs(yr_te[i] - yr_pred[i]) for i in range(len(yr_te))) / len(yr_te)
    ss_res = sum((yr_te[i] - yr_pred[i])**2 for i in range(len(yr_te)))
    ss_tot = sum((yr_te[i] - mean_(yr_te))**2 for i in range(len(yr_te)))
    r2 = 1 - ss_res / (ss_tot + 1e-9)
    print(f"  Regression MAE: {mae:.2f} days   R²: {r2:.3f}")

    def sigmoid(x):
        x = max(-500, min(500, x))
        return 1 / (1 + math.exp(-x))

    def log_loss_grad(y_true, pred_proba):
        return [y_true[i] - pred_proba[i] for i in range(len(y_true))]

    print("Training classification GBM stumps...")
    cls_init_log_odds = math.log(mean_(yc_tr) / (1 - mean_(yc_tr) + 1e-9))
    cls_preds = [sigmoid(cls_init_log_odds)] * n_tr
    cls_stumps = []

    for t in range(60):
        grads = log_loss_grad(yc_tr, cls_preds)
        feat, thresh, lv, rv = best_stump(X_tr, grads)
        cls_stumps.append((feat, thresh, lv * 0.15, rv * 0.15))
        for i in range(n_tr):
            log_odds = cls_init_log_odds + sum(predict_stump(s, X_tr[i]) for s in cls_stumps)
            cls_preds[i] = sigmoid(log_odds)
        if (t + 1) % 20 == 0:
            print(f"  Iteration {t+1}/60...", end=" ", flush=True)
    print()

    def predict_cls_proba(x):
        log_odds = cls_init_log_odds + sum(predict_stump(s, x) for s in cls_stumps)
        return sigmoid(log_odds)

    yc_proba = [predict_cls_proba(x) for x in X_te]
    yc_pred_hard = [1 if p >= 0.5 else 0 for p in yc_proba]
    tp = sum(1 for i in range(len(yc_te)) if yc_te[i] == 1 and yc_pred_hard[i] == 1)
    tn = sum(1 for i in range(len(yc_te)) if yc_te[i] == 0 and yc_pred_hard[i] == 0)
    acc = (tp + tn) / len(yc_te)
    print(f"  Classification Accuracy: {acc:.3f}")

    # Dummy feature importances via stump frequency
    fi = [0.0] * len(FEATURE_NAMES)
    for feat, thresh, lv, rv in reg_stumps:
        fi[feat] += 1
    total = sum(fi) or 1
    fi_reg = {FEATURE_NAMES[i]: round(fi[i] / total, 4) for i in range(len(FEATURE_NAMES))}
    fi_cls = fi_reg  # stumps don't separate well; reuse

    # Pack stumps as single-split "trees"
    def stump_to_tree(feat, thresh, lv, rv):
        return {
            "left_child":  [1, -1, -1],
            "right_child": [2, -1, -1],
            "feature":     [feat, -2, -2],
            "threshold":   [thresh, -2.0, -2.0],
            "value":       [0.0, lv, rv],
        }

    model_json = {
        "meta": {
            "name": "NoBet GBM Relapse Predictor",
            "version": "2.0.0",
            "algorithm": "Gradient Boosted Stumps (pure-Python)",
            "architecture": f"GBM 80 stumps (reg) + 60 stumps (cls)",
            "parameters": (len(reg_stumps) + len(cls_stumps)) * 4,
            "features": FEATURE_NAMES,
            "dataset_size": N,
            "reg_mae_days": round(float(mae), 2),
            "reg_r2": round(float(r2), 4),
            "cls_auc": 0.0,
            "cls_acc": round(float(acc), 4),
            "independent": True,
            "externalAPIs": 0,
        },
        "regressor": {
            "init_prediction": float(reg_init),
            "learning_rate": 1.0,  # already baked in
            "n_estimators": len(reg_stumps),
            "trees": [stump_to_tree(*s) for s in reg_stumps],
        },
        "classifier": {
            "init_log_odds": float(cls_init_log_odds),
            "learning_rate": 1.0,
            "n_estimators": len(cls_stumps),
            "trees": [stump_to_tree(*s) for s in cls_stumps],
        },
        "feature_importance": {
            "regressor": fi_reg,
            "classifier": fi_cls,
        },
    }

# ─────────────────────────────────────────────────────────────────────────────
# SAVE MODEL JSON
# ─────────────────────────────────────────────────────────────────────────────

model_path = os.path.join(out_dir, "model.json")
with open(model_path, "w", encoding="utf-8") as f:
    json.dump(model_json, f, indent=2, ensure_ascii=False)

size_kb = os.path.getsize(model_path) / 1024
print(f"\nOK Model saved -> {model_path}  ({size_kb:.0f} KB)")

# Copy to app bundle (Next.js / API uses src/lib/ai/relapse_model.json)
app_model_path = os.path.join(out_dir, "..", "src", "lib", "ai", "relapse_model.json")
app_model_dir = os.path.dirname(app_model_path)
os.makedirs(app_model_dir, exist_ok=True)
shutil.copy2(model_path, app_model_path)
print(f"  Copied -> {app_model_path}")

print(f"  Trees: {model_json['regressor']['n_estimators']} regressor + {model_json['classifier']['n_estimators']} classifier")
print(f"  Parameters: {model_json['meta']['parameters']}")
print("\nDone!")
