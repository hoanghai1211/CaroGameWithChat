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
* MySql: DB chứa dữ liệu

Nguồn tài liệu tham khảo:
* CaroGame: https://github.com/manhlinhhumg89/Game-Caro-use-Socketio-Expressjs.git
* Chat Realtime: https://github.com/bradtraversy/chatcord.git

# Hướng dẫn cách chạy chương trình
* Tải sourcecode tại đường dẫn: https://github.com/hoanghai1211/CaroGameWithChat.git
* Chạy chương trình bằng lệnh trên Terminal: npm start
* Trên Chrome mở đường link: https://caro-game-with-chat.herokuapp.com/
* Nhập tên và join room.

# Mô tả chương trình 

1. Người chơi truy cập vào đường dẫn https://caro-game-with-chat.herokuapp.com/ và login.
2. Giao diện domain:
	- Hiển thị danh sách người đã join domain (N, S,...)
	- Hiển thị danh sách room đang available & đã full, với mỗi room sẽ có nút JOIN vào trở thành player hoặc viewer.
	- Nút Create room: Người dùng có thể tạo 1 room mới và chờ người dùng khác join vào.
	- Nut Leave domain: Người dùng thoát khỏi domain trở về màn hình đăng nhập.
3. Giao diện trong Room
	- Sau khi join vào 1 room cụ thể, các người dùng có thể tương tác:
		+ Giao diện hiển thị tên người chơi, người thứ 1 và thứ 2 join vào room sẽ là player, còn lại là viewer.
		+ Player & viewer có thể cùng chat vs nhau.
		+ Nút Ready: khi cả player 1 và player 2 cùng ấn ready --> Thông báo start game và cho phép người chơi đánh cờ.
		+ Viewer khi tick vào bàn cờ sẽ không trả ra Egì. 
		+ Khi viewer vào sau khi trận đấu đã đang diễn ra thì game sẽ show bàn cờ với các nước đã đi.
		+ Nút Resign: khi 1 player nhận thua cuộc. Đi kèm là popup confirm bạn sẽ thua.
        + Nút Draw: khi player A muốn kết thúc ván với kết quả hoà. Player B sẽ nhận được popup: A xin hoà?
		+ Nút New Game: tạo ván đấu mới. Cụ thể:
			++ Nút sẽ chìm trong quá trình ván đấu đang diễn ra.
			++ Nút chỉ cho phép click khi ván đấu đã kết thúc.
			++ Khi 1 player click, thông báo sẽ được gửi đến player còn lại --> Confirm thì sẽ tạo ván đấu mới.
		+ Nút Leave Room: Thoát khỏi phòng.
			++ Nếu là viewer thì thoát luôn k có confirm.
			++ Nếu là player && ván đấu đang diễn ra --> Có confirm bạn sẽ thua. Khi player A thoát thì player B và viewer còn lại 
			sẽ nhận được thông báo player A đã thoát, player B đã thắng.
			++ Nếu là player && ván đấu chưa diễn ra --> Có confirm thoát khỏi room. Khi player A thoát thì player B và viewer sẽ nhận được thông báo A đã thoát.
		+ Khi player A đánh xong lượt, giao diện sẽ cập nhật: Đến lượt người chơi B.
		+ Khi ván đấu kết thúc --> trả kết quả cho người thắng, người thua, viewer.
		+ Sau khi start game, mỗi người chơi có tối đa 3 phút suy nghĩ. Nếu ai hết 3 phút suy nghĩ trước mà chưa kết thúc ván thì người đó sẽ thua.
		
# Giải pháp xử lý:
	- Lưu trữ các bản dữ liệu trên DB MySQL
		+ Domain:
			++ ID
			++ Name
		+ Room:
			++ ID
			++ Name
			++ Domain ID
            ++ CreatedDate
            ++ UserCreated
            ++ Status (0:Phòng đã bị huỷ bỏ (player 1 thoát phòng) ; 1: còn trống; 2: Đã full người chơi)
		+ User 
			++ ID tăng dần
			++ Username
            ++ Socket ID
			++ Room ID
			++ Domain ID 
			++ Player (1: player; 0: viewer; null: khi không join room nào)
        + Games (tại 1 thời điểm 1 room chỉ có 1 game được diễn ra)
            ++ ID tăng dần
            ++ Room ID
            ++ Domain ID
            ++ Player 1
            ++ Player 2
            ++ GameStatus (0: chưa diễn ra; 1: đang diễn ra; 2: đã kết thúc)
            ++ Result (1: player 1 thắng; 2: player 2 thắng; 0: hoà)
            ++ Player1_Status (khi Player1 Ready thì cập nhật trạng thái = 1)
            ++ Player2_Status
            ++ arrBoard: ma trận bàn cờ dạng string
            ++ NextTurn: giá trị là user sẽ đánh nước tiếp theo
    - Chương trình hiện tại chỉ quản lý các user đang login vào chương trình, không quản lý theo password và lịch sử đăng nhập.
    - Khi user join Domain
        + Check nếu user đã tồn tại trong bảng Users (đang login) thì alert và không cho login.
        + Tạo 1 bản ghi trong tbl User (room ID null, player null)
        + Hiển thị danh sách phòng với status > 0
    - Khi user leave Domain
        + Xoá bản ghi của user trong tbl User
    - Khi user create Room
        + Tạo 1 bản ghi trong tbl Room, nếu Room name đã tồn tại thì alert.
        + Tạo 1 bản ghi trong tbl Game, khởi tạo bàn cờ và update vào arrBoard trong tbl games
    - Khi user join Room
        + Check game của room đã full 2 người chơi chưa, nếu chưa thì update giá trị Player 2 tại tbl Game.
        + Update trường thông tin Room ID, Player của user trong tbl User.
        + Check nếu là Player và phòng đã full 2 người chơi thì sẽ hiển thị các nút: Ready
    - Khi player kích ready
        + Ghi 1 message vào khung chat: player A sẵn sàng.
        + Ẩn nút Ready trên màn hình user A, active các nút Resign, Draw. New Game chỉ hiện thị khi ván đấu đã kết thúc.
        + Check nếu đủ 2 player ready --> Start game, update tbl Game set GameStatus = 1.
    - Start Game:
        + Thông báo đến lượt chơi người thứ 1
        + Available các nút Draw, Resign
        + Visible label Timer của 2 người chơi
        + Đếm ngược countdown thời gian suy nghĩ: tối đa 2 phút/ người chơi 1 ván.
        + Khi người chơi đi xong turn thì sẽ dừng biến đếm và chuyển sang biến đếm của ng chơi còn lại.
        + Nếu ván đấu kết thúc thì dừng biến đếm của cả 2
        + Nếu ai hết thời gian trước thì thua
    - Sự kiện người chơi đánh cờ
        + Server socket nhận sự kiện su-kien-click
        + Server check nước đi có hợp lệ k và gửi lại all client trong room theo sự kiện send-play-turn
        + Client bắt sự kiện send-play-turn để vẽ lên bàn cờ
        + trong sự kiện send-play-turn, thực hiện dừng biến đếm thời gian của người chơi vừa đánh. Nếu ván chưa kết thúc thì bật biến đếm thời gian của đối thủ.
    - Khi player A kích Draw
        + Phía player A hiển thị popup: Bạn muốn hoà?
        + Các nút Draw, Resign, NewGame ở 2 player sẽ bị disable cho đến khi có kết quả.
        + Khi player A xác nhận, phía player B hiển thị popup: A muốn hoà.
        + Nếu B confirm hoà --> update kết quả ván đầu vào tbl Game. Active nút NewGame.
        + Nếu B reject --> Popup sang phía A là B reject, tiếp tục ván đấu.
    - Khi player A kích Resign
        + Phía player A hiển thị popup: Bạn muốn xin thua?
        + Khi A xác nhận, phía player B hiển thị popup: A đã xin thua, bạn đã chiến thắng
        + Cập nhật kết quả lên giao diện của player & viewer người chiến thắng
        + Active nút new game.
    - Khi player A kích NewGame
        + chỉ active nút New Game khi ván đấu cũ đã kết thúc.
        + Khi player A kích, player B nhận được popup: A muốn chơi lại ván đấu mới?
        + Player B confirm --> cập nhật lại thông tin ván đấu trong tbl Game, khởi tạo lại bàn cờ.
        + Player B reject --> popup phía A là B reject.
    - Khi player A kích Leave Room hoặc disconnect socket.io
        + Nếu A là viewer --> update Room ID của A tại tbl User về null.
        + Nếu A là player 1 (chủ phòng) & ván đấu chưa diễn ra --> popup hỏi: Bạn muốn thoát phòng?
            ++ A confirm --> thông báo đến player 2 và viewer: Chủ phòng đã rời khỏi phòng! Vui lòng thoát ra. Update status của phòng = 0.
            ++ A reject --> không thực hiện gì cả.
        + Nếu A là player 1 (chủ phòng) & ván đấu đang diễn ra --> popup hỏi: Bạn muốn thoát phòng?
            ++ A confirm --> thông báo đến player 2 và viewer: Chủ phòng đã rời khỏi phòng, Player 2 chiến thắng! Vui lòng thoát ra. Update status của phòng = 0. Cập nhật lại trạng thái ván đấu.
            ++ A reject --> không thực hiện gì cả.
        + Nếu A là player 1 (chủ phòng) & ván đấu đã kết thúc --> popup hỏi: Bạn muốn thoát phòng?
            ++ A confirm --> thông báo đến player 2 và viewer: Chủ phòng đã rời khỏi phòng! Vui lòng thoát ra. Update status của phòng = 0. Cập nhật lại trạng thái ván đấu.
            ++ A reject --> không thực hiện gì cả.

        + Nếu A là player 2 & ván đấu chưa diễn ra --> popup hỏi: Bạn muốn thoát phòng?
            ++ A confirm --> thông báo đến player 1 và viewer: Player 2 đã rời khỏi phòng, vui lòng chờ người chơi mới!
            ++ A reject --> Không thực hiện gì cả
        + Nếu A là player 2 & ván đấu đang diễn ra --> popup hỏi: Bạn muốn thoát phòng?
            ++ A confirm --> thông báo đến player 1 và viewer: Player 2 đã rời khỏi phòng, bạn đã chiến thắng! Vui lòng chờ người chơi mới!. Cập nhật lại trạng thái ván đấu và khởi tạo lại bàn cờ.
            ++ A reject --> Không thực hiện gì cả
        + Nếu A là player 2 & ván đấu đã kết thúc --> popup hỏi: Bạn muốn thoát phòng?
            ++ A confirm --> thông báo đến player 1 và viewer: Player 2 đã rời khỏi phòng, vui lòng chờ người chơi mới!. Cập nhật lại trạng thái ván đấu và khởi tạo lại bàn cờ.
            ++ A reject --> Không thực hiện gì cả

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


# Vướng mắc

* Khi người chơi click vào bàn cờ, sự kiện click gửi lên server và server sẽ xử lý:
    - Check các điều kiện: có phải ng chơi và có đúng lượt của ng chơi đó? trạng thái ván đấu có phải vẫn đang tiếp diễn? ô click đã được đánh trước đó chưa?
    - Nếu thoả mãn tất cả các điều kiện trên thì mới được tính là nước đi hợp lệ và được xử lý tiếp: vẽ lên bàn cờ của toàn bộ client trong room, cập nhật trạng thái ván cờ, ma trận bàn cờ, nước đi tiếp theo vào DB. Dừng biến đếm giờ của người vừa đánh và bật biến đếm giờ của người chơi tiếp theo.
 --> Khi test trên local, tốc độ xử lý server và DB nhanh dẫn đến k có độ trễ, bộ biến đếm của 2 người chơi được bật tắt k có vấn đề gì.
 --> Khi check trên prod, tốc độ xử lý server và DB có độ trễ, dẫn đến nếu như double click và 1 ô thì bộ biến đếm bị mất đồng bộ, dẫn đến lỗi đếm thời gian. Nếu như k double click thì chương trình chạy bình thường. 

* Chưa bắt được sự kiện session tự end sau 1h. Dẫn đến nếu user không leave domain mà chỉ tắt trình duyệt thì sau 1h session end, user vẫn chưa bị xoá khỏi bảng user. Khi user bật trình duyệt lên đăng nhập lại user đó thì sẽ bị thông báo user exists! và phải sử dụng user khác (k có pass).

* Chưa rõ vì sao khi test local, 2 user dùng cùng trình duyệt Chrome (1 mở 1 ẩn) thì khi A request hoà hoặc NewGame thì B không hiển thị popup. Nếu 2 user dùng 2 trình duyệt khác nhau (Chrome và Safari) thì OK.

* Khi phía 1 người chơi request hoà hoặc resign thì Popup hiện lên làm biến đếm countdown của phía người chơi đó mất đồng bộ với giá trị thực tế.
