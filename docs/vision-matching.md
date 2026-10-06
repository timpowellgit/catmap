# Vision Matching Architecture

CatMap treats computer vision as candidate retrieval, not automatic identity.
The system must be able to return "unknown" and every suggested match requires
human confirmation.

## Processing lifecycle

1. The mobile client uploads a normalized sighting image.
2. `create_sighting` saves the sighting and atomically enqueues one private
   `sighting_analysis_jobs` row.
3. A service-role worker claims the job and performs cat detection, quality
   checks, attribute extraction, and embedding generation.
4. Postgres retrieves a small candidate set using vector similarity and spatial
   and temporal filters.
5. A local-marking matcher reranks only those candidates.
6. Calibrated fusion returns probable candidates, insufficient evidence, or an
   unknown cat.
7. Owners and moderators confirm or reject candidates. Those decisions become
   training and evaluation labels.

The worker and model are intentionally not selected in the first migration.
Model choice must follow a reproducible benchmark and a commercial-license
review.

## Privacy boundary

- Exact coordinates remain in `sightings` and are visible only to the owner.
- Shared feed data comes from `list_active_sightings`, which cannot return exact
  coordinates or location accuracy.
- Public coordinates represent the center of a 0.005-degree cell rather than a
  precise capture point.
- Analysis jobs have row-level security enabled and no client grants.
- Public display images should eventually be normalized and stripped of
  metadata, with sensitive backgrounds blurred when practical.

## Model benchmark

Before integrating a production model, compare animal-specific and general
visual backbones on the same time-separated cat dataset. Measure Recall@1,
Recall@5, Recall@10, unknown-cat rejection, false owner alerts, inference time,
and cost. Include visually similar hard negatives from the same neighborhood.

The initial candidate architecture is:

- a small commercially usable global visual backbone;
- HNSW vector retrieval in Postgres;
- local feature matching for only the strongest candidates;
- spatial, temporal, quality, and confirmed-attribute score fusion;
- calibrated thresholds that can return unknown.
