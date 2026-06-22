// ListPickerWidget component extracted from AppBuilder.jsx
import React from 'react';

export const ListPickerWidget = ({ comp, viewMode, onWidgetInteraction, setActiveListPicker, dpShapeStyles }) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const isEnabled = comp.props.enabled !== false;
    const isVisible = comp.props.visible !== false;

    if (!isVisible && viewMode === 'PREVIEW') return null;

    const buttonText = comp.props.text || comp.props.label || 'List Picker';
    const shapeStyles = dpShapeStyles[comp.props.shape || 0] || dpShapeStyles[0];
    const alignmentMap = { 0: 'flex-start', 1: 'center', 2: 'flex-end' };
    const textAlignmentMap = { 0: 'left', 1: 'center', 2: 'right' };

    const justifyContent = alignmentMap[comp.props.textAlignment] || 'center';
    const textAlign = textAlignmentMap[comp.props.textAlignment] || 'center';
    const showFeedback = comp.props.showFeedback !== false;

    return (
        <button
            disabled={!isEnabled}
            onMouseDown={() => isEnabled && showFeedback && setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onClick={() => {
                if (viewMode === 'PREVIEW') {
                    onWidgetInteraction(comp, 'BeforePicking');
                    setActiveListPicker({
                        compId: comp.id,
                        searchQuery: '',
                        elements: comp.props.elements || comp.props.options || [],
                        title: comp.props.title || 'Select Item',
                        itemBg: comp.props.itemBackgroundColor,
                        itemText: comp.props.itemTextColor,
                        showFilterBar: comp.props.showFilterBar
                    });
                }
            }}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: justifyContent,
                textAlign: textAlign,
                padding: '10px 20px',
                backgroundColor: isEnabled ? (comp.props.backgroundColor || '#3b82f6') : '#e2e8f0',
                color: isEnabled ? (comp.props.textColor || comp.props.color || '#ffffff') : '#94a3b8',
                backgroundImage: comp.props.image ? `url(${comp.props.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: 'none',
                fontSize: `${comp.props.fontSize || 14}px`,
                fontWeight: comp.props.fontBold ? 700 : 400,
                fontStyle: comp.props.fontItalic ? 'italic' : 'normal',
                cursor: (viewMode === 'PREVIEW' && isEnabled) ? 'pointer' : 'default',
                transition: 'all 0.1s ease',
                opacity: isVisible ? (isPressed ? 0.7 : 1) : 0.5,
                transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                boxShadow: (viewMode === 'PREVIEW' && isEnabled) ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                ...shapeStyles
            }}
        >
            {buttonText}
        </button>
    );
};

export default ListPickerWidget;

