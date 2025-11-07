use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

#[derive(Debug, Serialize, Deserialize)]
struct Project {
    uid: String,
    title: String,
    description: String,
    recipient: String,
    slug: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProjectsResponse {
    data: Vec<Project>,
    page_info: PageInfo,
}

#[derive(Debug, Serialize, Deserialize)]
struct PageInfo {
    total_items: u32,
    page: u32,
    page_limit: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct Creator {
    basename: String,
    display_name: String,
    bio: String,
    avatar_url: String,
    total_tips_received: String,
    tip_count: u32,
    is_active: bool,
    created_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct TipRequest {
    to: String,
    amount: String,
    message: String,
    token: Option<String>,
}

#[tauri::command]
async fn get_projects(page: Option<u32>, limit: Option<u32>) -> Result<ProjectsResponse, String> {
    let client = reqwest::Client::new();
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(20);
    
    let url = format!("https://tipchain-api.deno.dev/projects?page={}&limit={}", page, limit);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<ProjectsResponse>().await {
                    Ok(data) => Ok(data),
                    Err(e) => Err(format!("Failed to parse response: {}", e))
                }
            } else {
                Err(format!("HTTP error: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e))
    }
}

#[tauri::command]
async fn get_creator(address: String) -> Result<Creator, String> {
    let client = reqwest::Client::new();
    let url = format!("https://tipchain-api.deno.dev/creators/{}", address);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Creator>().await {
                    Ok(data) => Ok(data),
                    Err(e) => Err(format!("Failed to parse response: {}", e))
                }
            } else {
                Err(format!("HTTP error: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e))
    }
}

#[tauri::command]
async fn register_creator(
    basename: String,
    display_name: String,
    bio: String,
    avatar_url: String
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = "https://tipchain-api.deno.dev/creators/register";
    
    let payload = serde_json::json!({
        "basename": basename,
        "displayName": display_name,
        "bio": bio,
        "avatarUrl": avatar_url
    });
    
    match client.post(url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(())
            } else {
                Err(format!("Registration failed: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e))
    }
}

#[tauri::command]
async fn send_tip(tip_request: TipRequest) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = "https://tipchain-api.deno.dev/tips/send";
    
    let payload = serde_json::json!({
        "to": tip_request.to,
        "amount": tip_request.amount,
        "message": tip_request.message,
        "token": tip_request.token.unwrap_or_else(|| "ETH".to_string())
    });
    
    match client.post(url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok("Tip sent successfully!".to_string())
            } else {
                Err(format!("Tip failed: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e))
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Angel Requests!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            get_projects,
            get_creator,
            register_creator,
            send_tip
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}