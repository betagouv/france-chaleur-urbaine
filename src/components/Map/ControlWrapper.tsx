import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const ControlWrapper: React.FC<{ event?: string }> = ({ children, event }) => {
  const map = useMap();
  const ref: React.RefObject<HTMLDivElement> | undefined = React.createRef();

  const defaultEvent = 'click dblclick mousewheel scroll touchstart';

  useEffect(() => {
    if (ref.current) {
      L.DomEvent.on(ref.current, event || defaultEvent, function (ev) {
        L.DomEvent.stopPropagation(ev);
      });
    }
  }, [event, ref]);

  return (
    <div
      ref={ref}
      onMouseOver={() => {
        map.dragging.disable();
      }}
      onMouseOut={() => {
        map.dragging.enable();
      }}
      onClick={(e) => {
        // console.log('click');
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
};

export default ControlWrapper;

// import 'leaflet-defaulticon-compatibility';
// import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
// import 'leaflet/dist/leaflet.css';
// import React, { useEffect } from 'react';
// import { useMap } from 'react-leaflet';
// import styled from 'styled-components';

// const ControlWrapperContainer = styled.div`
//   position: relative;
// `;
// const ControlWrapperInterceptor = styled.div`
//   position: absolute;
//   top: 0;
//   right: 0;
//   bottom: 0;
//   left: 0;
//   border: 1px solid red;
//   pointer-events: none;
// `;
// const ControlWrapperBody = styled.div`
//   position: relative;
// `;

// const ControlWrapperInterceptorWrapper: React.FC<{ event?: string }> = ({
//   event,
// }) => {
//   const map = useMap();
//   const ref: React.RefObject<HTMLDivElement> | undefined = React.createRef();

//   const defaultEvent = 'click dblclick mousewheel scroll touchstart';

//   useEffect(() => {
//     if (ref.current) {
//       L.DomEvent.on(ref.current, event || defaultEvent, function (ev) {
//         L.DomEvent.stopPropagation(ev);
//       });
//     }
//   }, [event, ref]);

//   return (
//     <ControlWrapperInterceptor
//       ref={ref}
//       onClick={() => console.log('Interceptor')}
//     />
//   );
// };

// const ControlWrapper: React.FC<{ event?: string }> = ({ children, event }) => {
//   const map = useMap();
//   const ref: React.RefObject<HTMLDivElement> | undefined = React.createRef();

//   const defaultEvent = 'click dblclick mousewheel scroll touchstart';

//   // useEffect(() => {
//   //   if (ref.current) {
//   //     L.DomEvent.on(ref.current, event || defaultEvent, function (ev) {
//   //       L.DomEvent.stopPropagation(ev);
//   //     });
//   //   }
//   // }, [event, ref]);

//   return (
//     <ControlWrapperContainer
//       // ref={ref}
//       onMouseOver={() => {
//         map.dragging.disable();
//       }}
//       onMouseOut={() => {
//         map.dragging.enable();
//       }}
//     >
//       {/* {children} */}
//       {/* <ControlWrapperInterceptor /> */}
//       <ControlWrapperBody>{children}</ControlWrapperBody>
//       <ControlWrapperInterceptorWrapper />
//     </ControlWrapperContainer>
//   );
// };

// export default ControlWrapper;
