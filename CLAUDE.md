# SoundCloud Clone Project Context

Dự án mô phỏng nền tảng âm nhạc SoundCloud, tập trung vào kiến trúc hệ thống bài bản, bảo mật và hiệu năng streaming.

## 🛠 Tech Stack
- **Backend:** Java 21, Spring Boot 3.x, Spring Security (JWT + RBAC), Spring Data JPA.
- **Frontend:** Next.js (App Router), TypeScript, TanStack Query (React Query), Axios, Material UI/Tailwind.
- **Database:** MySQL.
- **Storage:** Local Storage (đang cấu hình qua `storage.properties`) / Định hướng Cloudinary.

## 🏛 System Architecture & Patterns

### Backend (Spring Boot)
- **Kiến trúc 3 lớp:** Controller -> Service -> Repository. Tuyệt đối không gọi Repository từ Controller.
- **Response Format:** Tất cả API trả về chuẩn `RestResponse<T>` (statusCode, message, data, error).
- **Security:** - Phân quyền dựa trên Role và Permission (RBAC). 
    - Danh sách Role/Permission được định nghĩa trong `roles.properties`.
- **Dữ liệu & Phân trang:** - Sử dụng `Specification` cho lọc động (Filtering).
    - Sử dụng `Entity Graph` để fetch dữ liệu (`Join Fetch`) tránh lỗi N+1.
    - Không bọc `RestResponse` cho các API streaming file (Resource) để tránh `ClassCastException`.

### Frontend (Next.js)
- **Component:** Phân biệt rõ `"use client"` cho các trang cần Hook (useState, useQuery) và Server Component.
- **Data Fetching:** Sử dụng Custom Hooks kết hợp với TanStack Query.
- **State Management:** Ưu tiên dùng URL params cho phân trang/lọc để hỗ trợ SEO và phím Back/Forward.
- ** màu chủ đề backgroud của hệ thống là màu background:rgba(255,255,255,0.2);
- ** chú ý khi làm giao diện thì phải thiết kế giao diện cho điện thoại và các thiết bị khác ngoài máy tính

## 📂 Project Structure Highlights
- `djnd.project.SoundCloud.utils.error`: Chứa `GlobalException` xử lý lỗi tập trung.
- `djnd.project.SoundCloud.domain.response`: Định nghĩa chuẩn trả về `RestResponse`.
- `/hooks`: Chứa các custom hooks React Query (vd: `useMyTracks`).
- `/resources`: Chứa `application.properties`, `roles.properties`, `storage.properties`.

## 📜 Development Rules & Conventions
1. **Naming:** - Backend: PascalCase cho Class, camelCase cho method/biến.
    - Database: snake_case cho table/column.
2. **Logic:** - Xử lý dữ liệu thô (convert List sang Map, mapping DTO) phải nằm ở **Service**.
    - Hàm `@Scheduled` dọn dẹp file tạm không được có tham số.
    - Luôn kiểm tra Path Traversal (`..`) khi xử lý file hệ thống.
3. **Query:** - Ưu tiên `Interface Projection` cho các câu query lấy ít trường.
    - Cẩn trọng khi dùng `Entity Graph` với `One-to-Many` kèm phân trang (tránh In-memory paging).

## 🚀 Current Focus
- Đã hoàn thành hệ thống đồng bộ Audio Global (TrackContext) với giao diện sóng nhạc Wavesurfer.
- Đảm bảo 100% hệ thống chỉ phát một track tại cùng một thời điểm.
- Hỗ trợ khôi phục tự động (resume) chính xác mốc thời gian lúc Pause cho từng track độc lập khi chuyển qua lại giữa các bài hát.
- **Fixed:** Lỗi ngắt kết nối ref của React H5 Audio Player khiến không Pause và không Scrub (tua) được mốc thời gian trên thẻ `audio` thật. Đã gắn event `timeupdate` và `seeked` native giúp đồng bộ 1:1 millisecond trơn tru mà không tốn CPU loop.
- **UI Update:** Thiết kế lại thanh Player Footer mang phong cách chuẩn SoundCloud bản mới nhất: Nền đen tối giản, Controls bên trái, dọc thời gian cam giữa, Track Info & Thumbnail thu gọn đẹp mắt hiển thị bên phải.

### 🔧 Bug Fixes (Session 20/04)

#### 1. Comment Avatar Layout Vỡ Sau Khi Post
- **Nguyên nhân gốc:** `avatarPositions` useMemo dùng `wavesurfer?.getDuration()` trực tiếp — giá trị này có thể trả về `0` khi wavesurfer đang recalculate → tất cả vị trí comment thành `NaN`. Thêm vào đó, `key={waveformComments.length}` ép React re-mount toàn bộ DOM mỗi khi comment thay đổi.
- **Fix:** Thêm state `waveDuration` ổn định (chỉ set 1 lần khi `decode`), dùng nó thay cho `wavesurfer?.getDuration()`. Loại bỏ `key={waveformComments.length}` trên div comments container. Loại bỏ `waveformComments` local state, dùng React Query cache làm single source of truth.

#### 2. Auto-Play Khi Vào Trang track/[slug]
- **Nguyên nhân gốc:** `react-h5-audio-player` auto-play mặc định khi nhận `src` prop mới. Khi `fetchTrackData` gọi `setCurrentTrack(fullTrack)`, footer hiện ra với `src` mới → tự động phát.
- **Fix:** Thêm `autoPlay={false}` cho `<AudioPlayer>` trong footer. Waveform `interaction` handler chỉ seek (không auto-play) khi đang pause.

#### 3. Comment → Waveform Sync
- **Nguyên nhân:** `CommentSection` (pageSize:10) và `WaveTrack` (pageSize:100) dùng queryKey khác nhau → cache không liên thông.
- **Fix:** `CommentSection.handlePostComment()` giờ cũng `invalidateQueries` cho queryKey waveform (pageSize:100).

### 📐 Architecture Notes
- **Comment State:** `displayComments` giờ là `useMemo` duy nhất lấy từ React Query cache (`resComments?.data?.result`), fallback sang SSR `comments` prop. Không còn local state trung gian.
- **Duration:** `waveDuration` (number) được set 1 lần duy nhất khi wavesurfer emit `decode`, đảm bảo `avatarPositions` luôn tính toán đúng vị trí.
- **Playback:** Chỉ phát khi user click Play button (waveform hoặc footer). Footer player dùng `autoPlay={false}`.