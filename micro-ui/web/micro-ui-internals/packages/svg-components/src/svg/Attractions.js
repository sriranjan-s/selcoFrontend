import React from "react";
import PropTypes from "prop-types";

export const Attractions = ({ className, height = "24", width = "24", style = {}, fill = "#7a2829", onClick = null }) => {
  return (
    <svg width={width} height={height} className={className} onClick={onClick} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_1974_10828)">
        <path
          d="M10.4303 18.75C10.8003 18.29 11.3703 18 12.0003 18C12.6303 18 13.1903 18.29 13.5603 18.75C13.9503 18.66 14.3203 18.54 14.6803 18.39L13.2603 15.21C12.8703 15.36 12.4403 15.44 12.0003 15.44C11.5403 15.44 11.1003 15.35 10.7003 15.19L9.2703 18.38C9.6503 18.54 10.0303 18.67 10.4303 18.75ZM5.1503 10C4.9903 10.59 4.9003 11.21 4.9003 11.85C4.9003 12.6 5.0203 13.32 5.2303 14C5.8603 14.05 6.4503 14.4 6.7903 14.99C7.1203 15.56 7.1403 16.22 6.9003 16.78C7.1703 17.05 7.4603 17.31 7.7703 17.54L9.2903 14.15C8.8203 13.57 8.5403 12.83 8.5403 12.02C8.5403 10.13 10.0903 8.61 12.0003 8.61C13.9103 8.61 15.4603 10.14 15.4603 12.02C15.4603 12.84 15.1703 13.59 14.6803 14.18L16.1803 17.53C16.5003 17.29 16.8003 17.03 17.0803 16.74C16.8603 16.19 16.8803 15.54 17.2003 14.99C17.5303 14.42 18.1003 14.07 18.7203 14C18.9403 13.32 19.0603 12.59 19.0603 11.84C19.0603 11.2 18.9703 10.57 18.8103 9.98C18.1703 9.94 17.5503 9.59 17.2103 8.98C16.8503 8.36 16.8603 7.62 17.1803 7.03C16.2703 6.05 15.0803 5.32 13.7403 4.98C13.3903 5.6 12.7403 6 12.0003 6C11.2603 6 10.6103 5.59 10.2603 4.99C8.9203 5.33 7.7303 6.04 6.8203 7.02C7.1503 7.62 7.1703 8.37 6.8003 9C6.4503 9.62 5.8103 9.97 5.1503 10ZM3.8503 9.58C3.0703 8.98 2.8303 7.88 3.3403 7C3.8503 6.12 4.9203 5.77 5.8303 6.15C6.9403 4.98 8.3903 4.12 10.0103 3.73C10.1503 2.75 10.9903 2 12.0003 2C13.0103 2 13.8503 2.75 13.9803 3.73C15.6103 4.12 17.0503 4.97 18.1603 6.15C19.0703 5.77 20.1503 6.12 20.6503 7C21.1603 7.88 20.9203 8.98 20.1403 9.58C20.3703 10.35 20.4903 11.16 20.4903 12C20.4903 12.84 20.3703 13.65 20.1403 14.42C20.9203 15.02 21.1603 16.12 20.6503 17C20.1403 17.88 19.0703 18.23 18.1603 17.85C17.7603 18.28 17.3103 18.66 16.8203 19L18.1603 22H16.3003L15.3303 19.83C14.9003 20.01 14.4503 20.16 13.9903 20.27C13.8503 21.25 13.0103 22 12.0003 22C10.9903 22 10.1503 21.25 10.0203 20.27C9.5403 20.15 9.0803 20 8.6403 19.81L7.6603 22H5.7803L7.1403 18.97C6.6703 18.64 6.2303 18.26 5.8403 17.85C4.9203 18.23 3.8503 17.88 3.3403 17C2.8303 16.12 3.0703 15.02 3.8503 14.42C3.6203 13.65 3.5003 12.84 3.5003 12C3.5003 11.16 3.6203 10.35 3.8503 9.58Z"
          fill={fill}
        />
      </g>
      <defs>
        <clipPath id="clip0_1974_10828">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

Attractions.propTypes = {
  /** custom width of the svg icon */
  width: PropTypes.string,
  /** custom height of the svg icon */
  height: PropTypes.string,
  /** custom colour of the svg icon */
  fill: PropTypes.string,
  /** custom class of the svg icon */
  className: PropTypes.string,
  /** custom style of the svg icon */
  style: PropTypes.object,
  /** Click Event handler when icon is clicked */
  onClick: PropTypes.func,
};
