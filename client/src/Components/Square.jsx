import React from 'react';

const Square = ({ piece = "", onClick, isSelected }) => {
    const type = piece ? (piece[0] === "A" ? "A" : "B") : "";

    return (
        <div
            onClick={onClick}
            className={`w-24 h-24 flex justify-center items-center ${(type === "A" && !isSelected)? "bg-[#202d3c] border-[#86888b]" : "border-[#333537]"} border-2 m-1 
                        ${piece ? "hover:cursor-pointer" : ""} ${isSelected ? "bg-[#9ac3e8] border-[#d4d4d4]" : ""}`}
        >
            <h1 className={`text-xl ${type === "A" ? "text-red-600" : "text-blue-600"}`}>{piece}</h1>
        </div>
    );
};

export default Square;
