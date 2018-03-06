import React, { Component } from 'react';
import Search from '../Components/Search';
import Header from '../Components/Header';
import BarList from './BarList';
import Footer from '../Components/Footer';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bars: undefined,
      city: undefined,
      error: undefined,
      user: false,
      loading: false
    };
    this.submitForm = this.submitForm.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
  }

  componentDidMount() {
    this.fetchBars();
    fetch('/isuser', {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(json => {
      this.setState({user: json});
    })
  }

  updateGoing() {
    if(this.state.city && this.state.bars) {
      fetch(`/updateGoing?city=${this.state.city}`).then(res => {
        return res.json();
      }).then(json => {
        const bars = this.state.bars;
        const newJSON = bars.map(bar => {
          json.forEach(rest => {
            if(bar.id === rest.rest && rest.going.length > 0) {
              bar.going = rest.going.length;
            }
          });
          return bar;
        })
        this.setState({bars: newJSON});
      })
    }
  }

  fetchBars(city) {
    this.setState({loading: true})
    const url = city ? `/search?city=${city}` : '/search';
    fetch(url, {
      method: 'get',
      credentials: 'include'
    }).then(res => res.json())
    .then(json => {
      if(json.err) {
        this.setState({bars: undefined, city: json.city, error: json.err, loading: false});
        this.updateGoing();
      } else if(json) {
        this.setState({bars: json.bars, city: json.city, error: undefined, loading: false});
        this.updateGoing();
      } else {
        this.setState({loading: false});
      }
    });
  }

  submitForm(e) {
    e.preventDefault();
    const city = e.target.firstChild.value;
    this.fetchBars(city);
  }

  handleEvent(id) {
    if(this.state.user) {
      fetch(`/going?id=${id}&city=${this.state.city}`, {
        credentials: 'include',
      }).then(res => {
        return res.json();
      }).then(json => {
        const newBars = this.state.bars.map(bar => {
          if(bar.id === json.rest) {
            bar.going = json.going.length;
          }
          return bar;
        })
        this.setState({bars: newBars});
      })
    } else {
      window.location = "/auth/twitter";
    }
  }

  render() {
    return (
      <div className='container'>
        <Header />
        <Search submit={this.submitForm} city={this.state.city} loading={this.state.loading} />
        {this.state.loading && <h4 className='load'>Loading...</h4>}
        <BarList bars={this.state.bars} msg={this.state.error} handleEvent={this.handleEvent} />
        <Footer />
      </div>
    );
  }
}

export default App;