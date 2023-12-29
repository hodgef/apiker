import React from "react";

export const Content = ({ children } = {} as any) => {
    return (
        <div className="content mt-5">
          <div className="container">
            <div className="row justify-content-md-center">
              <div className="col-lg-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      );
};