output "service_url" {
  description = "Public URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.rubiks_tutor.uri
}

output "gemini_secret_name" {
  description = "Secret Manager secret ID for GEMINI_API_KEY"
  value       = google_secret_manager_secret.gemini_api_key.secret_id
}
