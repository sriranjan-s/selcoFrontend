import React from "react";
import PropTypes from "prop-types";

const Menu = (props) => {
  const keyPrefix = props.localeKeyPrefix || "CS_ACTION";
  return (
    <div className="menu-wrap" style={{...props.style,height:"8rem"}}>
      {props.options.map((option, index) => {
        return (
          <div style={{marginTop:"1px"}} key={index} onClick={() => props.onSelect(option)}>
            <p style={{marginTop:"0px !important"}}>{props.t ? props.t(Digit.Utils.locale.getTransformedLocale(option.forcedName || `${keyPrefix}_${props.optionKey ? option[props.optionKey] : option}`)) : option}</p>
          </div>
        );
      })}
    </div>
  );
};

Menu.propTypes = {
  options: PropTypes.array,
  onSelect: PropTypes.func,
};

Menu.defaultProps = {
  options: [],
  onSelect: () => {},
};

export default Menu;
