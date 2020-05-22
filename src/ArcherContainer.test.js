// @flow
import React from 'react';
import renderer from 'react-test-renderer';
import { type ShallowWrapper, shallow, mount } from 'enzyme';

import ArcherElement from './ArcherElement';
import ArcherContainer from './ArcherContainer';

const rootStyle = { display: 'flex', justifyContent: 'center' };
const rowStyle = {
  margin: '200px 0',
  display: 'flex',
  justifyContent: 'space-between',
};
const boxStyle = { padding: '10px', border: '1px solid black' };

describe('ArcherContainer', () => {
  const defaultProps = {
    arrowLength: 10,
    arrowThickness: 30,
    strokeColor: 'rgb(123, 234, 123)',
    strokeDasharray: '5,5',
  };

  type WrapperState = {
    sourceToTargetsMap: {
      [string]: Array<SourceToTargetType>,
    },
  };

  const defaultState: WrapperState = {
    sourceToTargetsMap: {
      foo: [
        {
          source: {
            anchor: 'top',
            id: 'first-element',
          },
          target: {
            anchor: 'bottom',
            id: 'second-element',
          },
        },
      ],
    },
  };

  const shallowRenderAndSetState = (newState?: WrapperState) => {
    const wrapper = shallow(
      <ArcherContainer {...defaultProps}>
        <div>child</div>
      </ArcherContainer>,
    );

    wrapper.setState(newState || defaultState);

    return wrapper;
  };

  it('should render given children and a svg element', () => {
    const wrapper: ShallowWrapper = shallowRenderAndSetState();

    expect(
      wrapper
        .childAt(0)
        .childAt(1)
        .text(),
    ).toEqual('child');

    expect(
      wrapper
        .childAt(0)
        .childAt(0)
        .getElements()[0].type,
    ).toEqual('svg');
  });

  it('should render svg with the marker element used to draw an svg arrow', () => {
    const wrapper: ShallowWrapper = shallowRenderAndSetState();
    const marker = wrapper.find('marker');
    const markerProps = marker.props();

    const expectedProps = {
      id: `${wrapper.instance().arrowMarkerUniquePrefix}first-elementsecond-element`,
      markerWidth: 10,
      markerHeight: 30,
      refX: '0',
      refY: 15,
      orient: 'auto',
      markerUnits: 'strokeWidth',
      children: <path d="M0,0 L0,30 L10,15 z" fill="rgb(123, 234, 123)" />,
    };

    expect(markerProps).toMatchObject(expectedProps);
  });

  describe('render', () => {
    describe('computeArrows', () => {
      it('renders an SVG arrow', () => {
        const wrapper: ShallowWrapper = shallowRenderAndSetState();
        const uniquePrefix: string = wrapper.instance().arrowMarkerUniquePrefix;

        const arrow = wrapper.instance()._computeArrows();

        const tree = renderer.create(arrow).toJSON();

        expect(tree).toMatchInlineSnapshot(`
<g>
  <path
    d="M0,0 C0,10 0,10 0,20"
    markerEnd="url(http://localhost/#${uniquePrefix}first-elementsecond-element)"
    style={
      Object {
        "fill": "none",
        "stroke": "rgb(123, 234, 123)",
        "strokeDasharray": "5,5",
        "strokeWidth": 2,
      }
    }
  />
</g>
`);
      });
    });

    describe('generateAllArrowMarkers', () => {
      it('renders an SVG marker', () => {
        const wrapper: ShallowWrapper = shallowRenderAndSetState();
        const uniquePrefix: string = wrapper.instance().arrowMarkerUniquePrefix;

        const marker = wrapper.instance()._generateAllArrowMarkers();

        const tree = renderer.create(marker).toJSON();

        expect(tree).toMatchInlineSnapshot(`
<marker
  id="${uniquePrefix}first-elementsecond-element"
  markerHeight={30}
  markerUnits="strokeWidth"
  markerWidth={10}
  orient="auto"
  refX="0"
  refY={15}
>
  <path
    d="M0,0 L0,30 L10,15 z"
    fill="rgb(123, 234, 123)"
  />
</marker>
`);
      });
    });
  });

  describe('Event Listeners', () => {
    it('should add/remove resize listeners when mounting/unmounting', () => {
      global.window.addEventListener = jest.fn();
      global.window.removeEventListener = jest.fn();

      const wrapper: ShallowWrapper = shallowRenderAndSetState();

      expect(global.window.addEventListener).toBeCalledWith('resize', expect.anything());

      wrapper.unmount();

      expect(global.window.removeEventListener).toBeCalledWith('resize', expect.anything());
    });
  });

  type ThirdPartyComponentProps = { ItemRenderer: React$Node };

  describe('Uses a functional child API to work with third party renderers', () => {
    const ThirdPartyComponent = ({
      ItemRenderer,
    }: ThirdPartyComponentProps): React$Element<'div'> => <div>{ItemRenderer}</div>;

    const RootElement = (): React$Element<'div'> => (
      <div style={rootStyle}>
        <ArcherElement
          id="root"
          relations={[
            {
              targetId: 'element2',
              targetAnchor: 'top',
              sourceAnchor: 'bottom',
              style: { strokeDasharray: '5,5' },
            },
          ]}
        >
          <div style={boxStyle}>Root</div>
        </ArcherElement>
      </div>
    );

    const ElementTwo = (): React$Element<typeof ArcherElement> => (
      <ArcherElement
        id="element2"
        relations={[
          {
            targetId: 'element3',
            targetAnchor: 'left',
            sourceAnchor: 'right',
            style: { strokeColor: 'blue', strokeWidth: 1 },
            label: <div style={{ marginTop: '-20px' }}>Arrow 2</div>,
          },
        ]}
      >
        <div style={boxStyle}>Element 2</div>
      </ArcherElement>
    );

    const ElementThree = (): React$Element<typeof ArcherElement> => (
      <ArcherElement id="element3" relations={[]}>
        <div style={boxStyle}>Element 3</div>
      </ArcherElement>
    );

    const ElementFour = (): React$Element<typeof ArcherElement> => (
      <ArcherElement
        id="element4"
        relations={[
          {
            targetId: 'root',
            targetAnchor: 'right',
            sourceAnchor: 'left',
            label: 'Arrow 3',
          },
        ]}
      >
        <div style={boxStyle}>Element 4</div>
      </ArcherElement>
    );

    const ItemRendererComponent = () => (
      <div style={{ height: '500px', margin: '50px' }}>
        <ArcherContainer strokeColor="red">
          {ArcherContext => (
            <ArcherContext.Consumer>
              {contextValue => (
                <ThirdPartyComponent
                  ItemRenderer={
                    <ArcherContext.Provider value={contextValue}>
                      <>
                        <RootElement />
                        <div style={rowStyle}>
                          <ElementTwo />
                          <ElementThree />
                          <ElementFour />
                        </div>
                      </>
                    </ArcherContext.Provider>
                  }
                />
              )}
            </ArcherContext.Consumer>
          )}
        </ArcherContainer>
      </div>
    );

    it('renders items', () => {
      mount(<ItemRendererComponent {...defaultProps} />);
    });
  });
});
