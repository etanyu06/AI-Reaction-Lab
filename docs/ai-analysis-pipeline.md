# AI Reaction Lab AI Analysis Pipeline

AI Reaction Lab generates research reports from consented participant sessions. The analysis must stay evidence-based and must not infer protected traits, identity, medical state, personality, or internal emotions from camera footage.

The AI report should describe observable behavior, participant speech, written feedback, task progress, and interaction events. It should use careful language and cite evidence with timestamps.

## Inputs

One-session analysis receives:

- Session transcript with timestamped segments.
- Click events.
- Scroll events.
- Pause/resume events.
- Task start and completion timestamps.
- Participant written feedback.
- Optional observer notes.
- Video/audio metadata.
- Optional manually selected reaction moments.
- Test context: landing page URL, participant intro, and tasks/questions.

Multi-session analysis receives:

- Completed one-session reports.
- Session metadata.
- Task completion summaries.
- Selected quotes and timestamped findings.
- Optional researcher notes.

## 1. JSON Schema For AI Report

Use structured output. Store the full validated JSON in `ai_reports.structured_output`, and normalize sections into `ai_report_sections`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AI Reaction Lab Session Report",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "report_type",
    "executive_summary",
    "top_friction_moments",
    "confusion_map",
    "trust_dropoffs",
    "engagement_moments",
    "quote_highlights",
    "task_completion_summary",
    "ux_recommendations",
    "severity_ratings",
    "suggested_clips",
    "limitations_and_confidence"
  ],
  "properties": {
    "schema_version": {
      "type": "string",
      "const": "2026-05-03"
    },
    "report_type": {
      "type": "string",
      "enum": ["single_session"]
    },
    "executive_summary": {
      "type": "object",
      "additionalProperties": false,
      "required": ["summary", "key_takeaways", "overall_confidence"],
      "properties": {
        "summary": {
          "type": "string",
          "maxLength": 1600
        },
        "key_takeaways": {
          "type": "array",
          "minItems": 1,
          "maxItems": 5,
          "items": {
            "$ref": "#/$defs/takeaway"
          }
        },
        "overall_confidence": {
          "$ref": "#/$defs/confidence"
        }
      }
    },
    "top_friction_moments": {
      "type": "array",
      "maxItems": 8,
      "items": {
        "$ref": "#/$defs/research_moment"
      }
    },
    "confusion_map": {
      "type": "array",
      "maxItems": 10,
      "items": {
        "$ref": "#/$defs/confusion_item"
      }
    },
    "trust_dropoffs": {
      "type": "array",
      "maxItems": 8,
      "items": {
        "$ref": "#/$defs/research_moment"
      }
    },
    "engagement_moments": {
      "type": "array",
      "maxItems": 8,
      "items": {
        "$ref": "#/$defs/research_moment"
      }
    },
    "quote_highlights": {
      "type": "array",
      "maxItems": 12,
      "items": {
        "$ref": "#/$defs/quote"
      }
    },
    "task_completion_summary": {
      "type": "array",
      "minItems": 1,
      "maxItems": 10,
      "items": {
        "$ref": "#/$defs/task_summary"
      }
    },
    "ux_recommendations": {
      "type": "array",
      "maxItems": 10,
      "items": {
        "$ref": "#/$defs/recommendation"
      }
    },
    "severity_ratings": {
      "type": "array",
      "maxItems": 12,
      "items": {
        "$ref": "#/$defs/severity_rating"
      }
    },
    "suggested_clips": {
      "type": "array",
      "maxItems": 10,
      "items": {
        "$ref": "#/$defs/clip"
      }
    },
    "limitations_and_confidence": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "overall_confidence",
        "data_quality",
        "limitations",
        "safety_notes"
      ],
      "properties": {
        "overall_confidence": {
          "$ref": "#/$defs/confidence"
        },
        "data_quality": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "transcript_quality",
            "event_quality",
            "recording_quality",
            "task_coverage"
          ],
          "properties": {
            "transcript_quality": {
              "$ref": "#/$defs/quality_level"
            },
            "event_quality": {
              "$ref": "#/$defs/quality_level"
            },
            "recording_quality": {
              "$ref": "#/$defs/quality_level"
            },
            "task_coverage": {
              "$ref": "#/$defs/quality_level"
            }
          }
        },
        "limitations": {
          "type": "array",
          "maxItems": 8,
          "items": {
            "type": "string",
            "maxLength": 500
          }
        },
        "safety_notes": {
          "type": "array",
          "minItems": 1,
          "maxItems": 5,
          "items": {
            "type": "string",
            "maxLength": 500
          }
        }
      }
    }
  },
  "$defs": {
    "confidence": {
      "type": "string",
      "enum": ["low", "medium", "high"]
    },
    "quality_level": {
      "type": "string",
      "enum": ["poor", "fair", "good", "excellent"]
    },
    "severity": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "evidence_type": {
      "type": "string",
      "enum": [
        "participant_quote",
        "written_feedback",
        "task_event",
        "click_event",
        "scroll_event",
        "pause_event",
        "manual_reaction",
        "observer_note",
        "video_audio_metadata"
      ]
    },
    "evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "timestamp_ms", "description"],
      "properties": {
        "type": {
          "$ref": "#/$defs/evidence_type"
        },
        "timestamp_ms": {
          "type": ["integer", "null"],
          "minimum": 0
        },
        "end_ms": {
          "type": ["integer", "null"],
          "minimum": 0
        },
        "task_id": {
          "type": ["string", "null"]
        },
        "description": {
          "type": "string",
          "maxLength": 800
        },
        "quote": {
          "type": ["string", "null"],
          "maxLength": 1000
        }
      }
    },
    "takeaway": {
      "type": "object",
      "additionalProperties": false,
      "required": ["title", "description", "severity", "confidence"],
      "properties": {
        "title": {
          "type": "string",
          "maxLength": 120
        },
        "description": {
          "type": "string",
          "maxLength": 600
        },
        "severity": {
          "$ref": "#/$defs/severity"
        },
        "confidence": {
          "$ref": "#/$defs/confidence"
        }
      }
    },
    "research_moment": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "title",
        "start_ms",
        "end_ms",
        "description",
        "evidence",
        "severity",
        "confidence"
      ],
      "properties": {
        "id": {
          "type": "string",
          "maxLength": 80
        },
        "title": {
          "type": "string",
          "maxLength": 140
        },
        "start_ms": {
          "type": "integer",
          "minimum": 0
        },
        "end_ms": {
          "type": "integer",
          "minimum": 0
        },
        "description": {
          "type": "string",
          "maxLength": 900
        },
        "evidence": {
          "type": "array",
          "minItems": 1,
          "maxItems": 5,
          "items": {
            "$ref": "#/$defs/evidence"
          }
        },
        "severity": {
          "$ref": "#/$defs/severity"
        },
        "confidence": {
          "$ref": "#/$defs/confidence"
        }
      }
    },
    "confusion_item": {
      "allOf": [
        {
          "$ref": "#/$defs/research_moment"
        },
        {
          "type": "object",
          "additionalProperties": true,
          "properties": {
            "likely_source": {
              "type": "string",
              "maxLength": 300
            }
          }
        }
      ]
    },
    "quote": {
      "type": "object",
      "additionalProperties": false,
      "required": ["text", "timestamp_ms", "task_id", "why_it_matters"],
      "properties": {
        "text": {
          "type": "string",
          "maxLength": 1000
        },
        "timestamp_ms": {
          "type": "integer",
          "minimum": 0
        },
        "task_id": {
          "type": ["string", "null"]
        },
        "why_it_matters": {
          "type": "string",
          "maxLength": 500
        }
      }
    },
    "task_summary": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "task_id",
        "task_prompt",
        "status",
        "start_ms",
        "end_ms",
        "summary",
        "evidence",
        "confidence"
      ],
      "properties": {
        "task_id": {
          "type": "string"
        },
        "task_prompt": {
          "type": "string",
          "maxLength": 1000
        },
        "status": {
          "type": "string",
          "enum": ["completed", "partially_completed", "skipped", "unclear"]
        },
        "start_ms": {
          "type": ["integer", "null"],
          "minimum": 0
        },
        "end_ms": {
          "type": ["integer", "null"],
          "minimum": 0
        },
        "summary": {
          "type": "string",
          "maxLength": 800
        },
        "evidence": {
          "type": "array",
          "maxItems": 5,
          "items": {
            "$ref": "#/$defs/evidence"
          }
        },
        "confidence": {
          "$ref": "#/$defs/confidence"
        }
      }
    },
    "recommendation": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "title",
        "recommendation",
        "rationale",
        "priority",
        "effort",
        "evidence",
        "confidence"
      ],
      "properties": {
        "title": {
          "type": "string",
          "maxLength": 140
        },
        "recommendation": {
          "type": "string",
          "maxLength": 900
        },
        "rationale": {
          "type": "string",
          "maxLength": 900
        },
        "priority": {
          "$ref": "#/$defs/severity"
        },
        "effort": {
          "type": "string",
          "enum": ["low", "medium", "high", "unknown"]
        },
        "evidence": {
          "type": "array",
          "minItems": 1,
          "maxItems": 5,
          "items": {
            "$ref": "#/$defs/evidence"
          }
        },
        "confidence": {
          "$ref": "#/$defs/confidence"
        }
      }
    },
    "severity_rating": {
      "type": "object",
      "additionalProperties": false,
      "required": ["area", "severity", "reason", "evidence"],
      "properties": {
        "area": {
          "type": "string",
          "maxLength": 120
        },
        "severity": {
          "$ref": "#/$defs/severity"
        },
        "reason": {
          "type": "string",
          "maxLength": 700
        },
        "evidence": {
          "type": "array",
          "minItems": 1,
          "maxItems": 5,
          "items": {
            "$ref": "#/$defs/evidence"
          }
        }
      }
    },
    "clip": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "title",
        "start_ms",
        "end_ms",
        "reason",
        "section_type",
        "confidence"
      ],
      "properties": {
        "title": {
          "type": "string",
          "maxLength": 140
        },
        "start_ms": {
          "type": "integer",
          "minimum": 0
        },
        "end_ms": {
          "type": "integer",
          "minimum": 0
        },
        "reason": {
          "type": "string",
          "maxLength": 700
        },
        "section_type": {
          "type": "string",
          "enum": [
            "friction",
            "confusion",
            "trust_dropoff",
            "engagement",
            "quote",
            "task_completion"
          ]
        },
        "confidence": {
          "$ref": "#/$defs/confidence"
        }
      }
    }
  }
}
```

## 2. Prompt For Analyzing One Session

System prompt:

```txt
You are a UX research analysis assistant for AI Reaction Lab.

Analyze only the provided consented user research session data. Produce a structured JSON report that matches the provided schema exactly.

You must follow these safety rules:
- Do not infer internal emotions, mental state, medical state, personality, identity, age, gender, race, ethnicity, disability, or other protected traits from video, camera, voice, behavior, or appearance.
- Do not produce biometric scoring, identity verification, face recognition, demographic classification, attractiveness judgments, or emotion scoring.
- Do not say "the participant was angry", "the participant was anxious", "the participant was confused", or similar claims unless the participant explicitly said so.
- Use careful evidence-based language:
  - "The participant appeared to hesitate."
  - "The participant paused for 8 seconds."
  - "The participant said they were confused."
  - "The participant reread this section."
  - "The participant smiled/laughed at this moment."
  - "The participant self-reported frustration."
- Prefer participant quotes, task events, pauses, written feedback, and manually marked reactions as evidence.
- If evidence is weak, label confidence as low and explain the limitation.
- Do not invent quotes, timestamps, tasks, clicks, scrolls, or observations.
- Do not include chain-of-thought or hidden reasoning. Return only valid JSON.

Focus on landing page reaction testing:
- What did the participant understand?
- Where did they hesitate, pause, reread, or express confusion?
- Where did trust appear to drop based on explicit comments, task behavior, or self-report?
- Where did engagement appear based on observable behavior or explicit comments?
- What landing page UX changes are supported by evidence?
```

User prompt template:

```txt
Analyze this AI Reaction Lab participant session and return JSON matching the schema.

TEST CONTEXT
Test ID: {{test_id}}
Landing page URL: {{landing_page_url}}
Participant intro: {{participant_intro}}
Tasks:
{{tasks_json}}

SESSION METADATA
Session ID: {{session_id}}
Duration seconds: {{duration_seconds}}
Recording metadata:
{{recording_metadata_json}}

TRANSCRIPT
Timestamped transcript segments:
{{transcript_segments_json}}

SESSION EVENTS
Click events:
{{click_events_json}}

Scroll events:
{{scroll_events_json}}

Pause/resume events:
{{pause_events_json}}

Task timestamps:
{{task_events_json}}

Manual/self-reported reaction moments:
{{manual_reactions_json}}

WRITTEN FEEDBACK
{{written_feedback_json}}

OBSERVER NOTES
{{observer_notes_json}}

ANALYSIS REQUIREMENTS
Return:
1. Executive summary
2. Top friction moments
3. Confusion map
4. Trust drop-off points
5. Engagement moments
6. Quote highlights
7. Task completion summary
8. UX recommendations
9. Severity ratings
10. Suggested clips
11. Limitations and confidence notes

Use timestamps in milliseconds. Suggested clips should include a small buffer before and after the key evidence where possible. Do not exceed the session duration.

If transcript quality is low, explicitly state limitations and reduce confidence.
```

## 3. Prompt For Summarizing Multiple Sessions

System prompt:

```txt
You are a UX research synthesis assistant for AI Reaction Lab.

Synthesize multiple consented landing page research session reports. Use only the provided reports and session metadata. Do not infer demographics, identity, protected traits, mental state, medical state, or emotions from camera footage or behavior.

Use evidence-based language. If a pattern appears in multiple sessions, cite the number of sessions and representative evidence. If a finding comes from only one session, say that clearly.

Do not invent participants, quotes, timestamps, or themes. Return structured JSON only.
```

User prompt template:

```txt
Create a cross-session landing page research summary.

TEST CONTEXT
Test ID: {{test_id}}
Landing page URL: {{landing_page_url}}
Tasks:
{{tasks_json}}

INCLUDED SESSIONS
{{session_metadata_json}}

SESSION REPORTS
{{session_reports_json}}

OUTPUT REQUIREMENTS
Return JSON with:
- executive_summary
- recurring_friction_patterns
- recurring_confusion_patterns
- recurring_trust_dropoffs
- recurring_engagement_patterns
- strongest_quotes
- task_completion_rollup
- recommended_landing_page_changes
- severity_rollup
- suggested_cross_session_clips
- limitations_and_confidence

For each recurring pattern, include:
- number of sessions where it appears
- affected task IDs if applicable
- representative quotes or timestamped evidence
- confidence
- recommended action

Do not claim statistically significant results. This is qualitative research synthesis.
```

Suggested multi-session output shape:

```ts
type TestSummaryReport = {
  schema_version: "2026-05-03";
  report_type: "multi_session";
  executive_summary: string;
  recurring_patterns: Array<{
    pattern_type: "friction" | "confusion" | "trust_dropoff" | "engagement";
    title: string;
    description: string;
    session_count: number;
    total_sessions: number;
    representative_evidence: Array<{
      session_id: string;
      timestamp_ms?: number;
      quote?: string;
      description: string;
    }>;
    severity: "low" | "medium" | "high" | "critical";
    confidence: "low" | "medium" | "high";
    recommendation: string;
  }>;
  task_completion_rollup: Array<{
    task_id: string;
    task_prompt: string;
    completed: number;
    partially_completed: number;
    skipped: number;
    unclear: number;
    notes: string;
  }>;
  limitations_and_confidence: {
    overall_confidence: "low" | "medium" | "high";
    limitations: string[];
    safety_notes: string[];
  };
};
```

## 4. Safety Constraints

Hard constraints:

- No biometric scoring.
- No face recognition.
- No identity verification.
- No protected trait inference.
- No age, gender, race, ethnicity, disability, or medical inference.
- No personality inference.
- No mental health inference.
- No internal emotion claims unless explicitly self-reported.
- No deception about evidence quality.
- No invented quotes or timestamps.

Allowed observations:

- Participant said they were confused.
- Participant self-reported frustration.
- Participant paused for a measured duration.
- Participant reread or returned to a section if visible in transcript/events/notes.
- Participant clicked a visible UI element if captured.
- Participant scrolled quickly or slowly if event data supports it.
- Participant laughed/smiled only as an observable moment, not as proof of emotion.
- Participant manually marked a moment as confusing, interesting, or trust-related.

Recommended wording:

- "The participant appeared to hesitate before clicking the CTA."
- "The participant paused for 8 seconds after reading the signup copy."
- "The participant said, 'I am not sure what this does.'"
- "The participant self-reported frustration in written feedback."
- "The participant returned to the hero section twice."

Disallowed wording:

- "The participant was anxious."
- "The participant is skeptical by personality."
- "The participant was angry based on their face."
- "The participant is young."
- "The participant seems non-technical based on appearance."
- "The participant is confused" without explicit self-report; use "may have encountered confusion" or "appeared to hesitate" instead.

## 5. Confidence Scoring Method

Use three levels: `low`, `medium`, `high`.

### Evidence Strength

High confidence:

- Explicit participant quote or written feedback.
- Clear task event plus matching transcript evidence.
- Multiple aligned signals, such as pause + quote + manual reaction.
- Timestamped evidence falls directly in the relevant task window.

Medium confidence:

- One strong behavioral signal, such as long pause or repeated navigation.
- Transcript implies an issue but wording is indirect.
- Manual reaction without explanatory quote.
- Event data supports the finding but transcript is incomplete.

Low confidence:

- Poor transcript quality.
- Missing task timestamps.
- Event-only evidence with no spoken/written explanation.
- Ambiguous behavior.
- Observer note without corroborating session evidence.

### Severity

Severity should reflect likely product impact, not emotional intensity.

Critical:

- Participant cannot complete a core task.
- Participant explicitly says they would not continue because of trust, safety, or unclear value.
- Core CTA or value proposition is misunderstood.

High:

- Major hesitation or confusion around primary conversion action.
- Trust concern near signup, data handling, product claims, or consent language.
- Repeated confusion across a core page section.

Medium:

- Localized copy/navigation issue.
- Participant completes task but with friction.
- Recommendation would improve clarity but does not block completion.

Low:

- Minor wording or visual hierarchy issue.
- Small polish item.
- Evidence is limited or impact is unclear.

### Confidence Calculation

Implementation can use a deterministic post-processing helper:

```ts
type EvidenceSignal = {
  hasExplicitQuote: boolean;
  hasWrittenFeedback: boolean;
  hasManualReaction: boolean;
  hasTaskEvent: boolean;
  hasClickOrScrollEvent: boolean;
  hasPauseEvent: boolean;
  transcriptQuality: "poor" | "fair" | "good" | "excellent";
  evidenceCount: number;
};

export function scoreConfidence(signal: EvidenceSignal) {
  let score = 0;

  if (signal.hasExplicitQuote) score += 3;
  if (signal.hasWrittenFeedback) score += 3;
  if (signal.hasManualReaction) score += 2;
  if (signal.hasTaskEvent) score += 2;
  if (signal.hasClickOrScrollEvent) score += 1;
  if (signal.hasPauseEvent) score += 1;
  if (signal.evidenceCount >= 3) score += 2;

  if (signal.transcriptQuality === "poor") score -= 3;
  if (signal.transcriptQuality === "fair") score -= 1;
  if (signal.transcriptQuality === "excellent") score += 1;

  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}
```

Use AI-provided confidence, then validate or adjust with deterministic checks. If evidence is empty, reject the finding or set confidence to `low`.

## 6. Example Output

```json
{
  "schema_version": "2026-05-03",
  "report_type": "single_session",
  "executive_summary": {
    "summary": "The participant understood that the landing page offered an AI research tool, but they hesitated around the primary call to action and wanted clearer privacy reassurance before continuing. The strongest evidence came from explicit comments about uncertainty on the CTA and data handling.",
    "key_takeaways": [
      {
        "title": "Primary CTA outcome was unclear",
        "description": "The participant asked whether the CTA would start a trial, create an account, or begin recording.",
        "severity": "high",
        "confidence": "high"
      },
      {
        "title": "Privacy reassurance should appear earlier",
        "description": "The participant looked for data handling details before saying they would feel comfortable continuing.",
        "severity": "high",
        "confidence": "medium"
      }
    ],
    "overall_confidence": "high"
  },
  "top_friction_moments": [
    {
      "id": "friction_cta_unclear",
      "title": "Unclear primary CTA",
      "start_ms": 42000,
      "end_ms": 63000,
      "description": "The participant appeared to hesitate at the primary CTA and explicitly asked what would happen after clicking it.",
      "evidence": [
        {
          "type": "participant_quote",
          "timestamp_ms": 48100,
          "end_ms": 53200,
          "task_id": "task_2",
          "description": "Participant questioned the CTA outcome.",
          "quote": "I don't know if this starts a trial or starts recording."
        },
        {
          "type": "pause_event",
          "timestamp_ms": 42100,
          "end_ms": 50100,
          "task_id": "task_2",
          "description": "Participant paused for about 8 seconds before commenting.",
          "quote": null
        }
      ],
      "severity": "high",
      "confidence": "high"
    }
  ],
  "confusion_map": [
    {
      "id": "confusion_recording_scope",
      "title": "Recording scope needed earlier explanation",
      "start_ms": 91000,
      "end_ms": 112000,
      "description": "The participant said they wanted to know exactly what would be recorded before trusting the product.",
      "evidence": [
        {
          "type": "participant_quote",
          "timestamp_ms": 98500,
          "end_ms": 104000,
          "task_id": "task_3",
          "description": "Participant asked for recording scope.",
          "quote": "I would want to know if it records my whole screen or just the website."
        }
      ],
      "severity": "high",
      "confidence": "high",
      "likely_source": "Privacy copy is not visible near the initial CTA."
    }
  ],
  "trust_dropoffs": [
    {
      "id": "trust_data_use",
      "title": "Data use concern near signup",
      "start_ms": 118000,
      "end_ms": 137000,
      "description": "The participant explicitly said they would look for privacy details before signing up.",
      "evidence": [
        {
          "type": "participant_quote",
          "timestamp_ms": 126000,
          "end_ms": 132000,
          "task_id": "task_3",
          "description": "Participant self-reported need for privacy reassurance.",
          "quote": "Before I sign up, I want to know what happens to the recordings."
        }
      ],
      "severity": "high",
      "confidence": "high"
    }
  ],
  "engagement_moments": [
    {
      "id": "engagement_example_report",
      "title": "Example report generated interest",
      "start_ms": 152000,
      "end_ms": 171000,
      "description": "The participant spent time on the example report section and said the clips and quotes would be useful.",
      "evidence": [
        {
          "type": "participant_quote",
          "timestamp_ms": 161000,
          "end_ms": 166000,
          "task_id": "task_4",
          "description": "Participant commented positively on report examples.",
          "quote": "This part is helpful because I can see what I would actually get."
        }
      ],
      "severity": "medium",
      "confidence": "high"
    }
  ],
  "quote_highlights": [
    {
      "text": "I don't know if this starts a trial or starts recording.",
      "timestamp_ms": 48100,
      "task_id": "task_2",
      "why_it_matters": "This quote directly explains CTA uncertainty."
    },
    {
      "text": "Before I sign up, I want to know what happens to the recordings.",
      "timestamp_ms": 126000,
      "task_id": "task_3",
      "why_it_matters": "This quote identifies a trust barrier around data handling."
    }
  ],
  "task_completion_summary": [
    {
      "task_id": "task_1",
      "task_prompt": "What do you think this product does?",
      "status": "completed",
      "start_ms": 5000,
      "end_ms": 38000,
      "summary": "The participant described the product as a tool for recording user reactions and summarizing them with AI.",
      "evidence": [
        {
          "type": "participant_quote",
          "timestamp_ms": 22000,
          "end_ms": 27000,
          "task_id": "task_1",
          "description": "Participant summarized the product value.",
          "quote": "It seems like this records people using a landing page and gives you the highlights."
        }
      ],
      "confidence": "high"
    }
  ],
  "ux_recommendations": [
    {
      "title": "Make the CTA outcome explicit",
      "recommendation": "Change the primary CTA copy to describe the next step, such as 'Create a test' or 'Start a sample test', and add one line underneath clarifying that recording happens only after participant consent.",
      "rationale": "The participant hesitated because the CTA did not explain what would happen next.",
      "priority": "high",
      "effort": "low",
      "evidence": [
        {
          "type": "participant_quote",
          "timestamp_ms": 48100,
          "end_ms": 53200,
          "task_id": "task_2",
          "description": "Participant questioned the CTA outcome.",
          "quote": "I don't know if this starts a trial or starts recording."
        }
      ],
      "confidence": "high"
    }
  ],
  "severity_ratings": [
    {
      "area": "CTA clarity",
      "severity": "high",
      "reason": "The participant could not predict the result of the main conversion action.",
      "evidence": [
        {
          "type": "participant_quote",
          "timestamp_ms": 48100,
          "end_ms": 53200,
          "task_id": "task_2",
          "description": "CTA outcome uncertainty.",
          "quote": "I don't know if this starts a trial or starts recording."
        }
      ]
    }
  ],
  "suggested_clips": [
    {
      "title": "CTA outcome confusion",
      "start_ms": 39000,
      "end_ms": 66000,
      "reason": "Shows the participant pausing at the CTA and explicitly asking what it does.",
      "section_type": "confusion",
      "confidence": "high"
    }
  ],
  "limitations_and_confidence": {
    "overall_confidence": "high",
    "data_quality": {
      "transcript_quality": "good",
      "event_quality": "fair",
      "recording_quality": "good",
      "task_coverage": "good"
    },
    "limitations": [
      "This is one participant session and should be treated as qualitative evidence, not a statistically representative result.",
      "Click and scroll events outside the AI Reaction Lab participant UI may be visible in the recording but not available as structured DOM events."
    ],
    "safety_notes": [
      "The report uses participant speech, written feedback, task events, and observable pauses as evidence.",
      "The report does not infer identity, protected traits, medical state, personality, or internal emotions from camera footage."
    ]
  }
}
```

## 7. Error Handling For Low-Quality Transcripts

Detect low quality before report generation:

- Transcript text is empty.
- Most segments are marked unintelligible.
- Average confidence from transcription provider is low, if available.
- Audio duration is much longer than transcript duration.
- Transcript language is unsupported or uncertain.
- Participant was silent for most of the session.

Report behavior:

- Still generate a limited report if event/task/written feedback data exists.
- Reduce `overall_confidence`.
- Prefer written feedback, manual reactions, task events, click/scroll events, and observer notes.
- Do not invent quotes.
- Set `quote_highlights` to an empty array if no reliable quotes exist.
- Add explicit limitations.

Low-quality transcript fallback prompt:

```txt
The transcript for this session is incomplete or low quality. Generate a limited research report using only reliable evidence from available transcript segments, written feedback, task events, interaction events, manually selected reaction moments, observer notes, and metadata.

Do not invent missing speech or quotes.
Do not overstate confidence.
If a section lacks enough evidence, return an empty array for that section and explain the limitation in limitations_and_confidence.
```

Failure states:

```ts
type AnalysisFailure =
  | "missing_transcript"
  | "low_quality_transcript"
  | "missing_recording_metadata"
  | "insufficient_session_data"
  | "schema_validation_failed"
  | "model_output_refused"
  | "model_timeout"
  | "provider_error";
```

Recommended handling:

- `missing_transcript`: attempt transcription once if recording exists.
- `low_quality_transcript`: generate limited report.
- `insufficient_session_data`: mark report failed with user-facing message.
- `schema_validation_failed`: retry once with schema-repair prompt, then fail.
- `model_timeout` or `provider_error`: retry with exponential backoff up to 2 times.

User-facing messages:

```txt
The transcript quality was low, so this report uses limited evidence and lower confidence ratings.
```

```txt
There was not enough usable session data to generate a reliable AI report.
```

```txt
AI analysis failed temporarily. You can retry after processing is available again.
```

Validation after model output:

- JSON parses.
- Schema validates.
- All timestamps are within session duration.
- Every finding has at least one evidence item unless it is a limitation.
- Quotes must match transcript or written feedback.
- Safety language scan catches disallowed claims.
- Suggested clip ranges are valid and not longer than allowed maximum.

If safety validation fails, repair or reject the report before showing it to the researcher.
