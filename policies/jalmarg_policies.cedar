// ==============================================================================
// JalMarg (जलमार्ग) - Cedar Authorization Policy Definition
// Engine: Cedar Policy Language / AWS Verified Permissions
// Enforces fine-grained governance to prevent crowdsource spoofing & panic.
// ==============================================================================

// Rule 1: Verified Citizens can report incidents and upload evidence photos
permit (
    principal in Role::"Citizen",
    action in [Action::"SubmitFloodReport", Action::"UploadEvidencePhoto"],
    resource in ResourceType::"IncidentReport"
);

// Rule 2: Only Verified Traffic Police and Municipal Engineers can mark roads OFFICIALLY BARRICADED
permit (
    principal in Role::"CivicAuthority",
    action in [Action::"MarkRoadBarricaded", Action::"DispatchDewateringPump"],
    resource in ResourceType::"RoadSegment"
)
when {
    context.hasCivicVerificationBadge == true
};

// Rule 3: Automated AI Models (SageMaker / Strands) can publish metrics ONLY with high confidence
permit (
    principal in Agent::"VisionDepthEstimator",
    action in [Action::"PublishDepthMetric", Action::"UpdateHeatmap"],
    resource in ResourceType::"RoadSegment"
)
when {
    context.modelConfidence >= 0.85
};

// Rule 4: Explicit Forbid: Unverified citizens cannot trigger civic pump dispatches
forbid (
    principal in Role::"Citizen",
    action in [Action::"MarkRoadBarricaded", Action::"DispatchDewateringPump"],
    resource in ResourceType::"RoadSegment"
);
