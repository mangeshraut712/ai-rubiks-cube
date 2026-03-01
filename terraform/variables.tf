variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "gemini-rubiks-tutor"
}

variable "image" {
  description = "Container image URI in Artifact Registry"
  type        = string
}

variable "demo_mode" {
  description = "Enable demo mode for judge-friendly evaluation."
  type        = bool
  default     = true
}

variable "cors_origin" {
  description = "Allowed CORS origins."
  type        = string
  default     = "*"
}

variable "gemini_live_model" {
  description = "Primary Gemini live model."
  type        = string
  default     = "gemini-2.0-flash-live-preview-04-09"
}

variable "gemini_fallback_model" {
  description = "Fallback Gemini model."
  type        = string
  default     = "gemini-2.0-flash-exp"
}
