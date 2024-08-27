import React from 'react'

const Button = ({text, event}) => {
  return (
    <button onClick={event  } className=' bg-green-700 w-48 h-12 rounded-xl'>{text}</button>
  )
}

export default Button