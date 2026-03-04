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
  default     = false
}

variable "cors_origin" {
  description = "Allowed CORS origins."
  type        = string
  default     = "https://*.run.app,http://localhost:5173,http://127.0.0.1:5173"
}

variable "gemini_live_model" {
  description = "Primary Gemini live model."
  type        = string
  default     = "gemini-2.5-flash-native-audio-preview-09-2025"
}

variable "gemini_fallback_model" {
  description = "Fallback Gemini model."
  type        = string
  default     = "gemini-2.5-flash"
}
