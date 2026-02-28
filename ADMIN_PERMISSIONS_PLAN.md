# Kế hoạch thay đổi Gom nhóm quyền

Chào bạn, tôi đã phân tích hệ thống phân quyền hiện tại trong `apps/api` (Strapi) và `apps/admin`. Dưới đây là kế hoạch chi tiết để gom nhóm các action và đánh giá tác động.

## 1. Phân tích hệ thống hiện tại

*   **Backend (`apps/api`)**:
    *   Tất cả các quyền quản lý được định nghĩa trong file `apps/api/src/api/management/helpers/resources-manifest.ts`.
    *   File này export một object tên là `MANAGEMENT_RESOURCES` chứa tất cả các "resource" (ví dụ: `post`, `hotel`) và các "action" (ví dụ: `create`, `update`) tương ứng.
    *   Hệ thống đã gom nhóm các action theo resource. Ví dụ: resource `post` có các action `list`, `find`, `create`, `update`, `delete`, `publish`, `unpublish`.
*   **Frontend (`apps/admin`)**:
    *   Component `apps/admin/src/components/role-permissions-editor.tsx` chịu trách nhiệm hiển thị giao diện phân quyền.
    *   Component này gọi API để lấy danh sách các action, sau đó dùng hàm `groupByResource` để gom nhóm chúng lại và hiển thị như bạn mong muốn.
    *   Hàm `resourceLabel` cũng được dùng để định dạng lại tên resource cho dễ đọc (ví dụ: `souvenirShop` -> `Souvenir Shop`).

**Kết luận:** Hệ thống hiện tại **về cơ bản đã đáp ứng** yêu cầu gom nhóm của bạn. Các action đã được gom lại theo từng resource (post, hotel, etc.).

## 2. Kế hoạch thay đổi (Nếu cần)

Có vẻ như bạn muốn thay đổi cách các nhóm này được đặt tên hoặc cấu trúc. Dưới đây là các phương án thay đổi và tác động của chúng.

### Phương án 1: Thay đổi tên hiển thị của Resource (Tác động thấp)

Nếu bạn chỉ muốn thay đổi tên hiển thị trên giao diện admin (ví dụ: từ "Post" thành "Bài viết"), chúng ta chỉ cần chỉnh sửa ở frontend.

*   **File cần thay đổi**: `apps/admin/src/components/role-permissions-editor.tsx`
*   **Nội dung thay đổi**: Cập nhật hàm `resourceLabel` để dịch các tên resource.
    ```typescript
    function resourceLabel(resource: string) {
      const labels: Record<string, string> = {
        post: "Bài viết",
        hotel: "Khách sạn",
        // ...thêm các resource khác ở đây
      };
      return labels[resource] || resource
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
    }
    ```
*   **Tác động**:
    *   **Admin**: Thay đổi nhỏ, chỉ cần cập nhật một hàm. Giao diện sẽ hiển thị tên mới.
    *   **API**: Không có tác động.

### Phương án 2: Thay đổi "resource key" trong hệ thống (Tác động trung bình)

Nếu bạn muốn thay đổi key của resource trong toàn bộ hệ thống (ví dụ: từ `post` thành `posts`), chúng ta cần cập nhật ở cả backend và frontend.

*   **File cần thay đổi (Backend)**: `apps/api/src/api/management/helpers/resources-manifest.ts`
*   **Nội dung thay đổi (Backend)**: Đổi tên key trong `MANAGEMENT_RESOURCES`.
    ```typescript
    // apps/api/src/api/management/helpers/resources-manifest.ts

    export const MANAGEMENT_RESOURCES: Record<string, string[]> = {
      posts: ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'], // đổi từ 'post'
      // ...
    };
    ```
*   **File cần thay đổi (Frontend)**: Cần cập nhật các file gọi API và kiểm tra quyền có sử dụng key cũ. Ví dụ trong `apps/admin/src/lib/permissions.ts` và các component khác.
*   **Tác động**:
    *   **API**: Cần tìm kiếm và thay thế tất cả các lần sử dụng resource key cũ.
    *   **Admin**: Cần cập nhật tất cả các chỗ gọi hàm `can("post", "create")` thành `can("posts", "create")`. Sẽ tốn nhiều công sức để tìm và thay thế.

## 3. Đánh giá tác động tới Admin

*   **Với phương án 1**: Tác động **rất thấp**. Chỉ cần thay đổi một file duy nhất trên admin. Đây là phương án được đề xuất nếu bạn chỉ quan tâm đến giao diện.
*   **Với phương án 2**: Tác động **trung bình đến cao**. Phải thay đổi ở nhiều nơi trong code của cả `apps/api` và `apps/admin`. Có nguy cơ gây lỗi nếu bỏ sót.

## 4. Đề xuất

Hệ thống hiện tại đã hỗ trợ gom nhóm. Nếu bạn chỉ muốn thay đổi tên hiển thị, hãy **chọn Phương án 1**.

Nếu bạn có yêu cầu khác về cấu trúc gom nhóm, vui lòng mô tả rõ hơn. Ví dụ: bạn muốn gom nhóm theo một cấp nữa (ví dụ: "Content" -> "Post", "Content" -> "Category")?

Bạn vui lòng cho biết phương án nào bạn muốn thực hiện nhé.
