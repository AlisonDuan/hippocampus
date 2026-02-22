use axum::{routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use std::net::SocketAddr;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Flashcard {
    id: String,
    front: String,
    back: String,
}

#[tokio::main]
async fn main() {
    // 1. Define CORS so your phone doesn't get blocked
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 2. Build the router
    let app = Router::new()
        .route("/cards", get(get_cards))
        .route("/sync", post(sync_cards))
        .layer(cors);

    // 3. Bind to 0.0.0.0 so it's accessible on your LOCAL NETWORK
    // Use your computer's local IP (e.g., 192.168.1.XX) on the phone
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_cards() -> Json<Vec<Flashcard>> {
    Json(vec![
        Flashcard { id: String::from("1"), front: String::from("Hello"), back: String::from("你好") },
        Flashcard { id: String::from("2"), front:  String::from("World"), back: String::from("世界") },
    ])
}

async fn add_cards() -> Json<String>{
    
}
async fn sync_cards(Json(payload): Json<Vec<Flashcard>>) -> Json<String> {
    println!("Received {} cards for sync", payload.len());
    Json("Sync Successful".into())
}
