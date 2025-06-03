import React, { useState } from 'react';
import { Card, Button, Space, Select, Slider, Switch, Divider, Typography, Tooltip } from 'antd';
import {
  BorderOutlined,
  EditOutlined,
  AimOutlined,
  DragOutlined,
  ScissorOutlined,
  HighlightOutlined,
  BgColorsOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const ManualAnnotationTools = ({ 
  selectedTool, 
  onToolChange, 
  brushSize, 
  onBrushSizeChange,
  opacity,
  onOpacityChange,
  showAnnotations,
  onToggleAnnotations,
  annotationMode,
  onAnnotationModeChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tools = [
    {
      id: 'select',
      name: 'Select',
      icon: <DragOutlined />,
      description: 'Select and move annotations',
      shortcut: 'V'
    },
    {
      id: 'bbox',
      name: 'Bounding Box',
      icon: <BorderOutlined />,
      description: 'Draw rectangular bounding boxes',
      shortcut: 'B'
    },
    {
      id: 'polygon',
      name: 'Polygon',
      icon: <EditOutlined />,
      description: 'Draw custom polygon shapes',
      shortcut: 'P'
    },
    {
      id: 'segment',
      name: 'AI Segment',
      icon: <AimOutlined />,
      description: 'Click to generate AI segmentation',
      shortcut: 'S'
    },
    {
      id: 'brush',
      name: 'Brush',
      icon: <HighlightOutlined />,
      description: 'Paint segmentation masks',
      shortcut: 'U'
    },
    {
      id: 'eraser',
      name: 'Eraser',
      icon: <ScissorOutlined />,
      description: 'Erase parts of annotations',
      shortcut: 'E'
    },
    {
      id: 'magic',
      name: 'Magic Wand',
      icon: <BgColorsOutlined />,
      description: 'Select similar colored regions',
      shortcut: 'W'
    }
  ];

  const annotationModes = [
    { value: 'detection', label: 'Object Detection', description: 'Bounding boxes only' },
    { value: 'segmentation', label: 'Instance Segmentation', description: 'Precise object masks' },
    { value: 'semantic', label: 'Semantic Segmentation', description: 'Pixel-level classification' }
  ];

  return (
    <Card 
      title={
        <Space>
          <EditOutlined />
          <span>Manual Annotation Tools</span>
        </Space>
      }
      size="small"
      extra={
        <Button 
          type="text" 
          icon={<SettingOutlined />}
          onClick={() => setShowAdvanced(!showAdvanced)}
        />
      }
    >
      {/* Annotation Mode Selection */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Mode:</Text>
        <Select
          value={annotationMode}
          onChange={onAnnotationModeChange}
          style={{ width: '100%', marginTop: 4 }}
          size="small"
        >
          {annotationModes.map(mode => (
            <Option key={mode.value} value={mode.value}>
              <div>
                <div>{mode.label}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{mode.description}</div>
              </div>
            </Option>
          ))}
        </Select>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Tool Selection */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Tools:</Text>
        <div style={{ marginTop: 8 }}>
          <Space wrap size={[4, 4]}>
            {tools.map(tool => (
              <Tooltip 
                key={tool.id}
                title={
                  <div>
                    <div>{tool.description}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Shortcut: {tool.shortcut}</div>
                  </div>
                }
              >
                <Button
                  type={selectedTool === tool.id ? 'primary' : 'default'}
                  icon={tool.icon}
                  size="small"
                  onClick={() => onToolChange(tool.id)}
                  style={{ 
                    minWidth: 36,
                    height: 36
                  }}
                />
              </Tooltip>
            ))}
          </Space>
        </div>
      </div>

      {/* Tool-specific Settings */}
      {(selectedTool === 'brush' || selectedTool === 'eraser') && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Brush Size:</Text>
          <Slider
            min={1}
            max={50}
            value={brushSize}
            onChange={onBrushSizeChange}
            style={{ marginTop: 4 }}
            tooltip={{ formatter: value => `${value}px` }}
          />
        </div>
      )}

      {/* Advanced Settings */}
      {showAdvanced && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ marginBottom: 12 }}>
            <Space justify="space-between" style={{ width: '100%' }}>
              <Text strong>Annotation Opacity:</Text>
              <Text>{Math.round(opacity * 100)}%</Text>
            </Space>
            <Slider
              min={0.1}
              max={1}
              step={0.1}
              value={opacity}
              onChange={onOpacityChange}
              style={{ marginTop: 4 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <Space justify="space-between" style={{ width: '100%' }}>
              <Text strong>Show Annotations:</Text>
              <Switch
                checked={showAnnotations}
                onChange={onToggleAnnotations}
                checkedChildren={<EyeOutlined />}
                unCheckedChildren={<EyeInvisibleOutlined />}
              />
            </Space>
          </div>
        </>
      )}

      {/* Tool Instructions */}
      <div style={{ 
        marginTop: 16, 
        padding: 8, 
        backgroundColor: '#f6f8fa', 
        borderRadius: 4,
        fontSize: 11,
        color: '#666'
      }}>
        {selectedTool === 'select' && (
          <div>
            <strong>Select Tool:</strong><br />
            • Click to select annotations<br />
            • Drag to move selected items<br />
            • Use handles to resize
          </div>
        )}
        {selectedTool === 'bbox' && (
          <div>
            <strong>Bounding Box:</strong><br />
            • Click and drag to create box<br />
            • Hold Shift for square aspect<br />
            • Double-click to finish
          </div>
        )}
        {selectedTool === 'polygon' && (
          <div>
            <strong>Polygon Tool:</strong><br />
            • Click to add points<br />
            • Double-click to finish<br />
            • Press Esc to cancel
          </div>
        )}
        {selectedTool === 'segment' && (
          <div>
            <strong>AI Segmentation:</strong><br />
            • Click on object to segment<br />
            • AI will generate precise mask<br />
            • Works best on clear objects
          </div>
        )}
        {selectedTool === 'brush' && (
          <div>
            <strong>Brush Tool:</strong><br />
            • Paint to create masks<br />
            • Adjust brush size as needed<br />
            • Hold Shift for straight lines
          </div>
        )}
        {selectedTool === 'eraser' && (
          <div>
            <strong>Eraser Tool:</strong><br />
            • Click and drag to erase<br />
            • Works on masks and polygons<br />
            • Adjust size for precision
          </div>
        )}
        {selectedTool === 'magic' && (
          <div>
            <strong>Magic Wand:</strong><br />
            • Click to select similar colors<br />
            • Adjust tolerance in settings<br />
            • Great for uniform backgrounds
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      {showAdvanced && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          backgroundColor: '#fff7e6', 
          borderRadius: 4,
          fontSize: 10,
          color: '#666'
        }}>
          <strong>Keyboard Shortcuts:</strong><br />
          V - Select | B - Bbox | P - Polygon<br />
          S - AI Segment | U - Brush | E - Eraser<br />
          W - Magic Wand | Space - Pan<br />
          Ctrl+Z - Undo | Ctrl+Y - Redo<br />
          Delete - Remove selected
        </div>
      )}
    </Card>
  );
};

export default ManualAnnotationTools;