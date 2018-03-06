import React from 'react';
import Bar from '../Components/Bar';

const BarList = ({ bars, msg, handleEvent }) => {
    let barlist;
    if(bars) {
        barlist = bars.map(bar => {
            return <Bar key={bar.id} bar={bar} handleEvent={handleEvent} />
        })
    }
    return (
        <div className='bar-div'>
            {msg && <p>{msg}</p>}
            {bars && <ul className='bar-list'>
                {barlist}
            </ul>}
        </div>
    )
}

export default BarList;