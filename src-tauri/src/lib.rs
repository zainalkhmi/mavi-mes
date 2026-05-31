use std::io::{Read, Write};
use std::net::TcpStream;
use std::sync::Mutex;
use std::thread;
use tauri::{AppHandle, Emitter, State};

struct TcpState {
    stream: Mutex<Option<TcpStream>>,
}

#[tauri::command]
fn tcp_connect(app: AppHandle, state: State<'_, TcpState>, ip: String, port: u16) -> Result<(), String> {
    let addr = format!("{}:{}", ip, port);
    
    let stream = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Invalid address: {}", e))?,
        std::time::Duration::from_secs(5),
    ).map_err(|e| format!("Failed to connect: {}", e))?;

    let read_stream = stream.try_clone().map_err(|e| format!("Failed to clone stream: {}", e))?;

    {
        let mut stream_guard = state.stream.lock().unwrap();
        *stream_guard = Some(stream);
    }

    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        let mut stream = read_stream;
        
        loop {
            match stream.read(&mut buf) {
                Ok(0) => {
                    let _ = app.emit("tcp-disconnect", "Server closed connection");
                    break;
                }
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app.emit("tcp-data", data);
                }
                Err(_) => {
                    let _ = app.emit("tcp-disconnect", "Read error");
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn tcp_send(state: State<'_, TcpState>, data: String) -> Result<(), String> {
    let mut stream_guard = state.stream.lock().unwrap();
    if let Some(stream) = stream_guard.as_mut() {
        stream.write_all(data.as_bytes()).map_err(|e| format!("Failed to send: {}", e))?;
        stream.flush().map_err(|e| format!("Failed to flush: {}", e))?;
        Ok(())
    } else {
        Err("Not connected".into())
    }
}

#[tauri::command]
fn tcp_disconnect(state: State<'_, TcpState>) -> Result<(), String> {
    let mut stream_guard = state.stream.lock().unwrap();
    if let Some(stream) = stream_guard.take() {
        let _ = stream.shutdown(std::net::Shutdown::Both);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TcpState {
            stream: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![tcp_connect, tcp_send, tcp_disconnect])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
