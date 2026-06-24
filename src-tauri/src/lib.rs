use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, State};
use tokio_modbus::client::Context as ModbusContext;
use tokio_modbus::prelude::*;
use tauri_plugin_shell::ShellExt;

struct TcpState {
    stream: Mutex<Option<TcpStream>>,
}

struct ModbusState {
    connections: Mutex<HashMap<String, Arc<tokio::sync::Mutex<ModbusContext>>>>,
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

#[tauri::command]
async fn modbus_connect(
    state: State<'_, ModbusState>,
    id: String,
    ip: String,
    port: u16,
    unit_id: u8,
) -> Result<(), String> {
    use std::net::SocketAddr;
    
    let addr_str = format!("{}:{}", ip, port);
    let socket_addr: SocketAddr = addr_str
        .parse()
        .map_err(|e| format!("Invalid IP address or port: {}", e))?;
        
    let slave = Slave(unit_id);
    
    let ctx = tokio_modbus::client::tcp::connect_slave(socket_addr, slave)
        .await
        .map_err(|e| format!("Failed to connect to Modbus TCP device: {}", e))?;
        
    let shared_ctx = Arc::new(tokio::sync::Mutex::new(ctx));
    
    let mut conns = state.connections.lock().unwrap();
    conns.insert(id, shared_ctx);
    
    Ok(())
}

#[tauri::command]
async fn modbus_disconnect(
    state: State<'_, ModbusState>,
    id: String,
) -> Result<(), String> {
    let mut conns = state.connections.lock().unwrap();
    if conns.remove(&id).is_some() {
        Ok(())
    } else {
        Err("Connection not found".to_string())
    }
}

#[tauri::command]
async fn modbus_read(
    state: State<'_, ModbusState>,
    id: String,
    reg_type: String,
    address: u16,
    quantity: u16,
) -> Result<Vec<u16>, String> {
    let conn = {
        let conns = state.connections.lock().unwrap();
        conns.get(&id).cloned().ok_or_else(|| "Not connected".to_string())?
    };
    
    let mut ctx = conn.lock().await;
    
    match reg_type.as_str() {
        "COIL" => {
            let data = ctx.read_coils(address, quantity)
                .await
                .map_err(|e| format!("Modbus Read Coils error: {}", e))?
                .map_err(|e| format!("Modbus Exception: {:?}", e))?;
            Ok(data.into_iter().map(|b| if b { 1 } else { 0 }).collect())
        }
        "DISCRETE_INPUT" => {
            let data = ctx.read_discrete_inputs(address, quantity)
                .await
                .map_err(|e| format!("Modbus Read Discrete Inputs error: {}", e))?
                .map_err(|e| format!("Modbus Exception: {:?}", e))?;
            Ok(data.into_iter().map(|b| if b { 1 } else { 0 }).collect())
        }
        "INPUT_REGISTER" => {
            let data = ctx.read_input_registers(address, quantity)
                .await
                .map_err(|e| format!("Modbus Read Input Registers error: {}", e))?
                .map_err(|e| format!("Modbus Exception: {:?}", e))?;
            Ok(data)
        }
        "HOLDING_REGISTER" => {
            let data = ctx.read_holding_registers(address, quantity)
                .await
                .map_err(|e| format!("Modbus Read Holding Registers error: {}", e))?
                .map_err(|e| format!("Modbus Exception: {:?}", e))?;
            Ok(data)
        }
        _ => Err(format!("Unknown register type: {}", reg_type)),
    }
}

#[tauri::command]
async fn modbus_write(
    state: State<'_, ModbusState>,
    id: String,
    reg_type: String,
    address: u16,
    value: u16,
) -> Result<(), String> {
    let conn = {
        let conns = state.connections.lock().unwrap();
        conns.get(&id).cloned().ok_or_else(|| "Not connected".to_string())?
    };
    
    let mut ctx = conn.lock().await;
    
    match reg_type.as_str() {
        "COIL" => {
            let bool_val = value != 0;
            ctx.write_single_coil(address, bool_val)
                .await
                .map_err(|e| format!("Modbus Write Coil error: {}", e))?;
            Ok(())
        }
        "HOLDING_REGISTER" => {
            ctx.write_single_register(address, value)
                .await
                .map_err(|e| format!("Modbus Write Holding Register error: {}", e))?;
            Ok(())
        }
        _ => Err(format!("Register type {} is not writable", reg_type)),
    }
}

#[tauri::command]
fn open_device_pairing_wizard() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("devicepairingwizard.exe")
            .spawn()
            .map_err(|e| format!("Failed to run DevicePairingWizard: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("/System/Library/PreferencePanes/Bluetooth.prefPane")
            .spawn()
            .map_err(|e| format!("Failed to open Mac Bluetooth settings: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn start_python_server() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let child = std::process::Command::new(".venv\\Scripts\\python.exe")
            .arg("yolo_server.py")
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn();
            
        match child {
            Ok(_) => Ok("Server starting...".to_string()),
            Err(e) => {
                let child_fallback = std::process::Command::new("python")
                    .arg("yolo_server.py")
                    .stdin(std::process::Stdio::null())
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn();
                match child_fallback {
                    Ok(_) => Ok("Server starting using global python...".to_string()),
                    Err(fe) => Err(format!("Failed to start python server: {} (fallback: {})", e, fe))
                }
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let child = std::process::Command::new(".venv/bin/python")
            .arg("yolo_server.py")
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn();
            
        match child {
            Ok(_) => Ok("Server starting...".to_string()),
            Err(e) => {
                let child_fallback = std::process::Command::new("python3")
                    .arg("yolo_server.py")
                    .stdin(std::process::Stdio::null())
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn();
                match child_fallback {
                    Ok(_) => Ok("Server starting using global python3...".to_string()),
                    Err(fe) => Err(format!("Failed to start python server: {} (fallback: {})", e, fe))
                }
            }
        }
    }
}

#[tauri::command]
fn stop_python_server() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let cmd = "for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %a";
        let output = std::process::Command::new("cmd")
            .args(&["/C", cmd])
            .output();
            
        match output {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                if out.status.success() || stdout.contains("SUCCESS") {
                    Ok("Python server stopped successfully".to_string())
                } else {
                    let err = String::from_utf8_lossy(&out.stderr).to_string();
                    Err(format!("Could not stop server. Output: {}, Err: {}", stdout, err))
                }
            }
            Err(e) => Err(format!("Failed to run stop command: {}", e))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = std::process::Command::new("sh")
            .args(&["-c", "kill -9 $(lsof -t -i:8000)"])
            .output();
            
        match output {
            Ok(out) => {
                if out.status.success() {
                    Ok("Python server stopped successfully".to_string())
                } else {
                    Err("No active python server found on port 8000".to_string())
                }
            }
            Err(e) => Err(format!("Failed to run stop command: {}", e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(TcpState {
            stream: Mutex::new(None),
        })
        .manage(ModbusState {
            connections: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            tcp_connect, 
            tcp_send, 
            tcp_disconnect,
            modbus_connect,
            modbus_disconnect,
            modbus_read,
            modbus_write,
            open_device_pairing_wizard,
            start_python_server,
            stop_python_server
        ])
        .setup(|app| {
            // Spawn Python YOLO Sidecar if on desktop
            #[cfg(desktop)]
            {
                match app.shell().sidecar("yolo_server") {
                    Ok(sidecar) => {
                        match sidecar.spawn() {
                            Ok(_) => println!("Successfully spawned yolo_server sidecar"),
                            Err(e) => eprintln!("Failed to spawn yolo_server sidecar: {:?}", e),
                        }
                    }
                    Err(e) => eprintln!("Failed to initialize yolo_server sidecar: {:?}", e),
                }
            }

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
