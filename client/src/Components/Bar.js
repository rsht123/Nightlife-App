import React from 'react';

const Bar = ({ bar, handleEvent }) => (
    <div className='bar'>
        {bar.image && <img src={bar.image} title='Bar view' alt="Bar view" />}
        {!bar.image && <img title='Image not Available' alt='Image not Available'/>}
        <div className='bar-title'>
            <a href={bar.url} target="_blank">{bar.name}</a>
            <button className='going' onClick={() => {
                handleEvent(bar.id);
            }}>{bar.going} GOING</button>
        </div>
        <p>{bar.cuisines}</p>
    </div>
)

export default Bar;