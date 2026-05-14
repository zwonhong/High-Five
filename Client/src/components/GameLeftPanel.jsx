function GameLeftPanel({nickname, messages}) {
    return (
        <div className="col-2 d-flex flex-column">

            {/* 사용자 정보 */}
            <div className="border rounded p-3 mb-3 text-center">
                <h5>
                    사용자({nickname})
                </h5>
            </div>

            {/* 채팅 입력란 */}
            <div className="mb-3">

                <div
                    className="border rounded-circle d-inline-block px-3 py-2 mb-2"
                >
                    채팅
                </div>

                <div
                    className="border p-3 mb-2"
                    style={{
                        height: "150px"
                    }}
                >
                    {
                        messages.map((message, index) => (

                            <div key={index} className="mb-2">

                                <strong>{message.user}</strong>
                                : {message.text}

                            </div>

                        ))
                    }
                </div>

                <input
                    type="text"
                    className="form-control"
                    placeholder="채팅 입력"
                />

            </div>

            {/* 가이드 그림 */}
            <div
                className="border rounded p-3 text-center"
                style={{
                    height: "350px"
                }}
            >
                <h5 className="mb-4">가이드그림</h5>
            </div>

        </div>
    );
}

export default GameLeftPanel;