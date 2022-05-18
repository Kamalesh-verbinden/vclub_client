import "./Logo.css";
import React from "react";



function TopNavigation() {
 
  return (
    <header className="bg-light navbar-sticky TopNavigation logined-pages-nav">
      <div className="navbar navbar-expand-lg vclubs-nav bg-white">
        <div className="container">
          <div className="fw-bold text-dark  vlclubs-logo-main">
            <a href ="vclubs/">
              The<span> Vclubs</span>
            </a>
          </div>
         
          </div>
        </div>
    </header>
  );
}
export default TopNavigation;
