import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Main from './components/Main/Main';
import Room from './components/Room/Room'
import styled from 'styled-components';
import TopNavigation from "./components/TopNavigation/TopNavigation";

function App() {
  return (
    <div>   
    <TopNavigation />
    <BrowserRouter>
      <AppContainer>
        <Switch>
          <Route exact path="/" component={Main} />
          <Route exact path="/room/:roomId" component={Room} />
        </Switch>
      </AppContainer>
    </BrowserRouter>
    </div>
  );
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column; 
  align-items: center;
  justify-content: center;
  font-size: calc(8px + 2vmin);
  background-color:#f3f2ef;
  text-align: center;
  overflow-y: scroll;
`;

export default App;
