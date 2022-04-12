# Demo CaroGameWithChat

Luồng:
    1. Người X join vào room --> Sự kiện Client-join-room
        + Người X gửi socket.emit lên server sự kiện trên 1 obj {username, room, msg}
        + Server gửi riêng cho X: Welcome to room ABC
    2. Người X type message + ấn Send
        + Client lọc lấy message và socket.emit lên server trong sự kiện SendMessagetoServer
        + Server lắng nghe sự kiện SendMessage và io.sockets.emit về toàn bộ user trong room trong sự kiện SendMessagetoUsers

