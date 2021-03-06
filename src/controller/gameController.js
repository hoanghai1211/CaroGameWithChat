// File chịu trách nhiệm khởi tạo ma trận 2 chiều ứng với bàn cờ, và check thắng thua theo phương thẳng đứng, ngang, chéo sau mỗi nước đi.

//Tao ra mang ban co trong do cac cell co gia tri ban dau la 0
//muc dich tao ra ma tran ban co nay de xet thang thua cho nguoi choi
//dung method cua Array
let InitMatrix = function (n, init) {
    let mat = [];
    for (let i = 0; i < n; i++) {
        let a = [];
        for (let j = 0; j < n; j++) {
            a[j] = init;
        }
        mat[i] = a;
    }
    return mat;
}
//mang ma tran ban co sau khi khoi tao se co dang nhu sau:
/*[ [ 0, 0, 0, 0, 0, 0, 0, 0 ],
 [ 0, 0, 0, 0, 0, 0, 0, 0 ],
 [ 0, 0, 0, 0, 0, 0, 0, 0 ],
 [ 0, 0, 0, 0, 0, 0, 0, 0 ],
 [ 0, 0, 0, 0, 0, 0, 0, 0 ],
 [ 0, 0, 0, 0, 0, 0, 0, 0 ],
 [ 0, 0, 0, 0, 0, 0, 0, 0 ],
 [ 0, 0, 0, 0, 0, 0, 0, 0 ] ]*/

let ConvertMatrixToString = (arrBoard) => {
    let str_arrBoard = "";
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (j === 0) {
                str_arrBoard += "[" + arrBoard[i][j] + ",";
            }
            else if (i === 14 && j === 14) {
                str_arrBoard += arrBoard[i][j] + "]";
            }
            else if (j === 14 && i != 14) {
                str_arrBoard += arrBoard[i][j] + "],";
            }
            else {
                str_arrBoard += arrBoard[i][j] + ",";
            }
        }
    }
    return str_arrBoard;
}

let ConvertStringToMatrix = (str_arrBoard) => {
    let arrBoard = eval("[" + str_arrBoard + "]");
    return arrBoard;
}

//Kiem tra thang thua khi nguoi choi danh nuoc moi tren ban co
//Kiểm tra theo phương ngang từ vị trí hiện tại đi sang trái và sang phải đếm xem có đủ 5 quân cùng giá trị thì trả về true
let Horizontal = (Mat, Cur_row, Cur_col, Value) => {
    //di sang ben trai
    let count_left = 0;
    let count_right = 0;
    //Di sang phia ben trai so voi vi tri hien tai
    for (let i = Cur_col; i >= 0; i--) {
        if (Mat[Cur_row][i] === Value) {
            count_left++;
        }
        else {
            break;
        }
    }
    //Di sang phia ben phai so voi vi tri hien tai
    for (let j = Cur_col + 1; j < 10; j++) {
        if (Mat[Cur_row][j] === Value) {
            count_right++;
        }
        else {
            break;
        }
    }
    if (count_right + count_left >= 5) {
        return 1;
    }
}
//Đếm số điểm theo phương thẳng đứng theo 2 hướng từ điểm hiên tại đi thẳng lên trên và đi xuống dưới nếu cả 2 phía trên và dưới
//tổng số ô cùng màu >=5 thì trả về giá trị true tức là chiến thắng
let Vertically = (Mat, Cur_row, Cur_col, Value) => {
    let i = Cur_row;
    let count_up = 0;
    let count_down = 0;
    for (let k = Cur_row; k < 10; k++) {
        if (Mat[k][Cur_col] === Value) {
            count_down++;
        }
        else {
            break;
        }
    }
    for (let h = Cur_row - 1; h >= 0; h--) {
        if (Mat[h][Cur_col] === Value) {
            count_up++;
        }
        else {
            break;
        }
    }
    if ((count_up + count_down >= 5)) {
        return 1;
    }
}
//Kiểm tra theo phương đường chéo phụ
let Diagonal = (Mat, Cur_row, Cur_col, Value) => {
    //kiểm tra theo phương đường chéo phía trên bên phải so với vị trí quân hiện tại
    let count_right_up = 0;
    let count_left_down = 0;
    let temp1 = 0;
    let temp2 = 1;
    for (let i = Cur_row; i >= 0; i--) {
        if (Mat[i][Cur_col + temp1] === Value) {
            count_right_up++;
            temp1++;
        }
        else {
            break;
        }
    }
    //kiểm tra theo phương đường chéo phía dưới bên trái so với vị trí quân hiện tại
    for (let j = Cur_row + 1; j < 10; j++) {
        if (Mat[j][Cur_col - temp2] === Value) {
            count_left_down++;
            temp2++;
        }
        else {
            break;
        }
    }
    if (count_right_up + count_left_down >= 5) {
        return 1;
    }
}
//Kiểm tra theo phương đường chéo chính
let Diagonal_main = (Mat, Cur_row, Cur_col, Value) => {
    let count_right_down = 0;
    let count_left_up = 0;
    let temp1 = 0;
    let temp2 = 1;
    //Kiểm tra theo phương đường chéo chính phía trên bên trái so với vị trí quân hiện tại
    for (let i = Cur_row; i >= 0; i--) {
        if (Mat[i][Cur_col - temp1] === Value) {
            count_left_up++;
            temp1++;
        }
        else {
            break;
        }
    }
    //Kiểm tra theo phương đường chéo chính phía dưới bên phải so với vị trí quân hiện tại
    for (let j = Cur_row + 1; j < 10; j++) {
        if (Mat[j][Cur_col + temp2] === Value) {
            count_right_down++;
            temp2++;
        }
        else {
            break;
        }
    }
    if (count_right_down + count_left_up >= 5) {
        return 1
    }
}


module.exports = {
    InitMatrix,
    Horizontal,
    Vertically,
    Diagonal,
    Diagonal_main,
    ConvertMatrixToString,
    ConvertStringToMatrix
}