use std::fs;
use std::path::PathBuf;

// 获取项目根目录下的 filestore 目录路径
fn get_filestore_path() -> PathBuf {
    // 获取当前可执行文件路径
    let exe_path = std::env::current_exe().expect("failed to get current exe path");
    
    // 开发模式: exe 在 src-tauri/target/debug/
    // 生产模式: exe 在安装目录
    // 我们需要找到项目根目录（包含 package.json 的目录）
    
    let mut current_dir = exe_path.parent().expect("failed to get exe parent");
    
    // 向上查找项目根目录
    for _ in 0..5 {
        // 检查是否是项目根目录（包含 package.json）
        if current_dir.join("package.json").exists() {
            return current_dir.join("filestore");
        }
        // 检查 app 子目录（开发模式）
        if current_dir.join("app").join("package.json").exists() {
            return current_dir.join("app").join("filestore");
        }
        current_dir = match current_dir.parent() {
            Some(p) => p,
            None => break,
        };
    }
    
    // 如果找不到项目根目录，使用当前工作目录
    let cwd = std::env::current_dir().expect("failed to get current dir");
    cwd.join("filestore")
}

// 确保 filestore 目录存在
fn ensure_filestore_dir() -> PathBuf {
    let path = get_filestore_path();
    if !path.exists() {
        fs::create_dir_all(&path).expect("failed to create filestore directory");
    }
    path
}

// 读取文件内容
#[tauri::command]
fn read_file(_app: tauri::AppHandle, filename: String) -> Result<String, String> {
    let dir = ensure_filestore_dir();
    let file_path = dir.join(&filename);
    
    if !file_path.exists() {
        return Ok("[]".to_string()); // 文件不存在时返回空数组
    }
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("failed to read file: {}", e))
}

// 写入文件内容
#[tauri::command]
fn write_file(_app: tauri::AppHandle, filename: String, content: String) -> Result<(), String> {
    let dir = ensure_filestore_dir();
    let file_path = dir.join(&filename);
    
    fs::write(&file_path, content)
        .map_err(|e| format!("failed to write file: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
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
        .invoke_handler(tauri::generate_handler![read_file, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
