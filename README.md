# CaroGameWithChat
Chương trình chơi cờ Caro được xây dựng với các chức năng cơ bản:
* User login để join vào room.
* Chương trình chơi cờ với 2 người chơi (2 người login đầu tiên).
* Người thứ 3, 4 có thể join vào room để theo dõi trận đấu (không thể đánh cờ).
* Chương trình có tính năng chat để người chơi và người theo dõi có thể nói chuyện với nhau qua chat box.

Các công nghệ được sử dụng để xây dựng chương trình:
* Express js: framework
* Socket.io: công nghệ giúp xử lý giao tiếp giữa client và server
* D3: thư viện sử dụng trong việc vẽ bàn cờ.

Nguồn tài liệu tham khảo:
* CaroGame: https://github.com/manhlinhhumg89/Game-Caro-use-Socketio-Expressjs.git
* Chat Realtime: https://github.com/bradtraversy/chatcord.git

# Hướng dẫn cách chạy chương trình
* Tải sourcecode tại đường dẫn: https://github.com/hoanghai1211/CaroGameWithChat.git
* Chạy chương trình bằng lệnh trên Terminal: npm start
* Trên Chrome mở đường link: http://localhost:8686
* Nhập tên và join room.

# Giải thích chương trình 

## Người chơi truy cập vào đường dẫn http://localhost:8686 và login

/public/image/LoginScreen.png

## Chức năng chính

/public/image/Game_ChatRealtime.png


### Chat box

```javascript
socket.on(`Client-join-room`, ({ username, room, message }) => {
        // xử lý logic
        }
    })
```
* Server lắng nghe sự kiện `Client-join-room` được user A gửi lên:
    - Nếu thoả mãn, lưu obj user A vào mảng users.
    - Tại chatbox của user A sẽ có message Welcome A to room do server gửi riêng về qua sự kiện `Server-send-data`
    - Nếu A là người chơi Caro (2 user login đầu tiên vào room) --> Update username của A lên giao diện tại sự kiện `Update-Info-Player`

```javascript
socket.on(`SendMessagetoServer`, ({ username, room, message }) => {
        // xử lý logic
    })
```
* Server lắng nghe sự kiện `SendMessagetoServer` được user A gửi lên:
    - Nhận message từ text box của user A
    - Gửi message đó đến toàn bộ user trong room qua sự kiện `Server-send-data` bằng hàm io.sockets.emit

```javascript
socket.on(`disconnect`, () => {
        // xử lý logic
    })
```
* Server lắng nghe sự kiện disconnect và loại bỏ user A ra khỏi mảng users

* Trên giao diện phía Client có nút Leave Room. Nếu người chơi ấn nút này, chương trình sẽ promt ra thông báo `Are you sure you want to leave room?`. Nếu người chơi xác nhận thì sẽ thoát khỏi ứng dụng và quay ra trang login.

### Caro Game

```javascript
let createCaroBoard = () => {
    // xử lý logic
}

let InitMatrix = function (n, init) {
    // xử lý logc
}
```

* Tại phía client chạy hàm createCaroBoard để vẽ bàn cờ và gắn sự kiện click vào từng toạ độ
* Tại phía Server chạy hàm Init Matrix để tạo mảng 2 chiều tương ứng với kích thước bàn cờ vẽ ở phía Client (n=15, giá trị init tại mỗi vị trí trong mảng là 0)

```javascript
socket.on("su-kien-click", function (data) { // toạ độ x, y
    // xử lý logic
    })
```
* Khi người chơi kích vào 1 ô trong bàn cờ <=> gửi lên server `su-kien-click` với thông tin là toạ độ x, y
* Tại phía server lắng nghe `su-kien-click` và xử lý các bước:
    - Sử dụng mảng players để lưu thông tin lượt đánh của 2 người chơi và không cho 1 người chơi gửi dữ liệu 2 lần liên tục lên server.
    - Gửi thông tin về nước đi của user A đến toàn bộ user trong room qua hàm io.sockets.emit, sự kiện `send-play-turn`
    - Kiểm tra bàn cờ theo phương thẳng đứng, ngang, đường chéo xem có thoả mãn 5 nước đi liền mạch không. Nếu không thì pass qua đến turn của người sau. Nếu thoả mãn thì trả kết quả.
* Tại phía client, sau khi nhận được thông tin về nước đi qua sự kiện `send-play-turn` thì sẽ hiển thị nước đi đó lên giao diện bàn cờ.

# Hạn chế của chương trình

* Chưa hoàn thiện tính năng nếu user A login vào chương trình mà đang có tab khác login bằng user A rồi thì sẽ trả ra cảnh báo.
* Chưa xử lý vấn đề nếu người C join vào room xem giữa trận đấu của người A & B thì sẽ load được bàn cờ tại thời điểm đó.
* Chưa có nút New Game và tạo lại bàn cờ mới.
* Hiện ở bản Demo thì mới chỉ có 1 room North và chưa có quản lý user/ password.
