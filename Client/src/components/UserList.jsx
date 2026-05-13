function UserList(){
    return (
        <div className="col-3">

          {/* 유저 목록 */}
          <div className="d-flex flex-column align-items-end mb-3">

            <div className="border rounded px-4 py-2 mb-2">
              유저1
            </div>

            <div className="border rounded px-4 py-2 mb-2">
              유저2
            </div>

            <div className="border rounded px-4 py-2 mb-2">
              유저3
            </div>

            <div className="border rounded px-4 py-2">
              유저4
            </div>

          </div>

        </div>
    );
}

export default UserList;