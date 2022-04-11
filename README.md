# Demo CaroGameWithChat

Luồng:
    1. Người X join vào room --> Sự kiện Client-join-room
        + Người X gửi socket.emit lên server sự kiện trên 1 obj {username, room, msg}
        + Server gửi riêng
