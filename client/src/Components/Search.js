import React from 'react';

const Search = ({ submit, city, loading }) => {
    if(city && !loading) {
        document.getElementById('form').firstChild.value = city;
    }
    return (
        <form id='form' className='form' onSubmit={submit}>
            <input type='text' placeholder='City Name' name='city' autoComplete='off' />
            <button className='btn'>Submit</button>
        </form>
    )
}

export default Search;