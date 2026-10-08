"""
JalMarg (जलमार्ग) - Cedar Policy Engine Evaluator
Evaluates fine-grained authorization decisions using Cedar policy semantics
(compatible with AWS Verified Permissions).
"""

from typing import Dict, Any


class CedarEvaluator:
    """
    Evaluator enforcing Cedar authorization rules defined in jalmarg_policies.cedar.
    """

    def is_authorized(
        self,
        principal_type: str,
        principal_id: str,
        action: str,
        resource_type: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluates (Principal, Action, Resource, Context) against Cedar policies.
        Returns: {"decision": "ALLOW" | "DENY", "reason": str}
        """

        # Rule 4: Explicit Forbid for Citizens attempting civic administrative actions
        if principal_type == "Role::Citizen" and action in ["Action::MarkRoadBarricaded", "Action::DispatchDewateringPump"]:
            return {
                "decision": "DENY",
                "reason": "FORBID: Citizens lack statutory authority to barricade public roads or dispatch municipal assets."
            }

        # Rule 1: Citizen submitting reports
        if principal_type == "Role::Citizen" and action in ["Action::SubmitFloodReport", "Action::UploadEvidencePhoto"]:
            if resource_type == "ResourceType::IncidentReport":
                return {
                    "decision": "ALLOW",
                    "reason": "PERMIT: Rule 1 permits crowd-sourced incident reporting."
                }

        # Rule 2: Civic Authority barricading or dispatching pumps
        if principal_type == "Role::CivicAuthority" and action in ["Action::MarkRoadBarricaded", "Action::DispatchDewateringPump"]:
            if resource_type == "ResourceType::RoadSegment":
                if context.get("hasCivicVerificationBadge") is True:
                    return {
                        "decision": "ALLOW",
                        "reason": "PERMIT: Rule 2 permits verified civic authority action."
                    }
                else:
                    return {
                        "decision": "DENY",
                        "reason": "DENY: Missing required civic verification badge in context."
                    }

        # Rule 3: Automated AI Agent updating depth metrics
        if principal_type == "Agent::VisionDepthEstimator" and action in ["Action::PublishDepthMetric", "Action::UpdateHeatmap"]:
            if resource_type == "ResourceType::RoadSegment":
                confidence = float(context.get("modelConfidence", 0.0))
                if confidence >= 0.85:
                    return {
                        "decision": "ALLOW",
                        "reason": f"PERMIT: Model confidence {confidence:.2f} satisfies >= 0.85 threshold."
                    }
                else:
                    return {
                        "decision": "DENY",
                        "reason": f"DENY: Model confidence {confidence:.2f} falls below 0.85 safety gate."
                    }

        # Default Deny (Zero Trust Principle)
        return {
            "decision": "DENY",
            "reason": "DEFAULT_DENY: No matching permit policy found."
        }
