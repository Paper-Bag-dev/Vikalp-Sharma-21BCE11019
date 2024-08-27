import React from 'react';

const Move = ({ piece = "", onClick }) => {
    return (
        <div
            className="w-20 h-12 flex justify-center items-center rounded-md border-[#222323] border-2 m-1 hover:cursor-pointer"
            onClick={onClick}
        >
            <h1 className="bg-[#111827]">{piece}</h1>
        </div>
    );
};

export default Move;
