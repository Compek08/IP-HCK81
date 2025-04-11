# IP-HCK81

## Dokumentasi API

### Autentikasi

#### Register User
- **Endpoint**: `POST /auth/register`
- **Deskripsi**: Mendaftarkan pengguna baru
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```

#### Login User
- **Endpoint**: `POST /auth/login`
- **Deskripsi**: Login pengguna yang sudah terdaftar
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

#### Google Login
- **Endpoint**: `POST /auth/google`
- **Deskripsi**: Login menggunakan akun Google
- **Request Body**:
  ```json
  {
    "token": "string"
  }
  ```

#### Verify Token
- **Endpoint**: `GET /auth/verify`
- **Deskripsi**: Memverifikasi token pengguna
- **Headers**: 
  - `Authorization: Bearer <token>`

### Game

#### Inisialisasi Game
- **Endpoint**: `POST /game/init`
- **Deskripsi**: Memulai sesi game baru
- **Headers**: 
  - `Authorization: Bearer <token>`

#### Get Dialogue Options
- **Endpoint**: `GET /game/session/:sessionId/options`
- **Deskripsi**: Mendapatkan opsi dialog untuk state saat ini
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Parameters**:
  - `sessionId`: ID sesi game

#### Get Dialogue History
- **Endpoint**: `GET /game/session/:sessionId/history`
- **Deskripsi**: Mendapatkan riwayat dialog
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Parameters**:
  - `sessionId`: ID sesi game

#### Select Option
- **Endpoint**: `POST /game/session/:sessionId/select`
- **Deskripsi**: Memilih opsi dialog
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Parameters**:
  - `sessionId`: ID sesi game
- **Request Body**:
  ```json
  {
    "optionId": "string"
  }
  ```

#### Get Player Status
- **Endpoint**: `GET /game/session/:sessionId/status`
- **Deskripsi**: Mendapatkan status pemain
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Parameters**:
  - `sessionId`: ID sesi game

#### Get Characters
- **Endpoint**: `GET /game/session/:sessionId/characters`
- **Deskripsi**: Mendapatkan daftar karakter
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Parameters**:
  - `sessionId`: ID sesi game

#### Get User Sessions
- **Endpoint**: `GET /game/sessions`
- **Deskripsi**: Mendapatkan daftar sesi game pengguna
- **Headers**: 
  - `Authorization: Bearer <token>`

#### Delete Session
- **Endpoint**: `DELETE /game/session/:sessionId`
- **Deskripsi**: Menghapus sesi game
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Parameters**:
  - `sessionId`: ID sesi game

#### Image Generation
- **Endpoint**: `GET /game/session/:sessionId/imageGen`
- **Deskripsi**: Menghasilkan gambar berdasarkan sesi game
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Parameters**:
  - `sessionId`: ID sesi game