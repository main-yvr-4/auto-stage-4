import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Space, 
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Alert,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress,
  Empty,
  Tooltip,
  Badge,
  Dropdown,
  Menu,
  Divider
} from 'antd';
import {
  UploadOutlined,
  RobotOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  MoreOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  BarChartOutlined,
  SearchOutlined,
  FilterOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { modelsAPI, handleAPIError } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;
const { Search } = Input;

const ModelsModern = () => {
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState(['yolov8n', 'yolov8s', 'yolov8m', 'yolov8l', 'yolov8x', 'custom']);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [form] = Form.useForm();

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    // Filter models based on search term and type
    let filtered = models;
    
    if (searchTerm) {
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(model => model.type === filterType);
    }
    
    setFilteredModels(filtered);
  }, [models, searchTerm, filterType]);

  // Load models and supported types
  const loadModels = async () => {
    setLoading(true);
    try {
      const modelsData = await modelsAPI.getModels();
      setModels(modelsData || []);
      
      // Try to get supported types, but don't fail if it doesn't work
      try {
        const typesData = await modelsAPI.getSupportedTypes();
        if (Array.isArray(typesData)) {
          setSupportedTypes(typesData);
        }
      } catch (typesError) {
        console.warn('Could not load supported types, using defaults');
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to load models: ${errorInfo.message}`);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  // Upload model
  const handleUpload = async (values) => {
    setUploading(true);
    try {
      await modelsAPI.uploadModel(values);
      message.success('Model uploaded successfully!');
      setUploadModalVisible(false);
      form.resetFields();
      loadModels();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to upload model: ${errorInfo.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete model
  const handleDelete = async (modelId) => {
    try {
      await modelsAPI.deleteModel(modelId);
      message.success('Model deleted successfully');
      loadModels();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to delete model: ${errorInfo.message}`);
    }
  };

  // Get model type info for styling
  const getModelTypeInfo = (type) => {
    const typeInfo = {
      'yolov8n': { color: 'blue', label: 'YOLOv8 Nano', icon: <ThunderboltOutlined /> },
      'yolov8s': { color: 'green', label: 'YOLOv8 Small', icon: <RobotOutlined /> },
      'yolov8m': { color: 'orange', label: 'YOLOv8 Medium', icon: <ExperimentOutlined /> },
      'yolov8l': { color: 'red', label: 'YOLOv8 Large', icon: <BarChartOutlined /> },
      'yolov8x': { color: 'purple', label: 'YOLOv8 XLarge', icon: <StarOutlined /> },
      'custom': { color: 'cyan', label: 'Custom Model', icon: <SettingOutlined /> }
    };
    return typeInfo[type] || { color: 'default', label: type, icon: <RobotOutlined /> };
  };

  // Get model status info
  const getModelStatus = (model) => {
    if (model.is_training) {
      return { status: 'processing', text: 'Training', color: 'blue' };
    }
    if (model.is_ready) {
      return { status: 'success', text: 'Ready', color: 'green' };
    }
    return { status: 'warning', text: 'Pending', color: 'orange' };
  };

  // Generate model thumbnail
  const getModelThumbnail = (model) => {
    const typeInfo = getModelTypeInfo(model.type);
    return (
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${
          typeInfo.color === 'blue' ? '#1890ff, #40a9ff' : 
          typeInfo.color === 'green' ? '#52c41a, #73d13d' : 
          typeInfo.color === 'orange' ? '#fa8c16, #ffa940' :
          typeInfo.color === 'red' ? '#f5222d, #ff4d4f' :
          typeInfo.color === 'purple' ? '#722ed1, #9254de' :
          typeInfo.color === 'cyan' ? '#13c2c2, #36cfc9' : '#d9d9d9, #f0f0f0'
        })`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        flexShrink: 0
      }}>
        {typeInfo.icon}
      </div>
    );
  };

  const renderModelCard = (model) => {
    const typeInfo = getModelTypeInfo(model.type);
    const statusInfo = getModelStatus(model);
    
    const moreMenu = (
      <Menu>
        <Menu.Item 
          key="view" 
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedModel(model);
            setViewModalVisible(true);
          }}
        >
          View Details
        </Menu.Item>
        <Menu.Item 
          key="download" 
          icon={<DownloadOutlined />}
          onClick={() => message.info('Download feature coming soon')}
        >
          Download Model
        </Menu.Item>
        <Menu.Item 
          key="duplicate" 
          icon={<PlusOutlined />}
          onClick={() => message.info('Duplicate feature coming soon')}
        >
          Duplicate Model
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item 
          key="delete" 
          icon={<DeleteOutlined />}
          danger
          onClick={() => {
            Modal.confirm({
              title: 'Delete Model',
              content: `Are you sure you want to delete "${model.name}"? This action cannot be undone.`,
              okText: 'Delete',
              okType: 'danger',
              cancelText: 'Cancel',
              onOk: () => handleDelete(model.id),
            });
          }}
        >
          Delete Model
        </Menu.Item>
      </Menu>
    );

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={model.id}>
        <Card
          hoverable
          style={{ 
            height: '100%',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.2s ease'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {/* Model Thumbnail */}
            {getModelThumbnail(model)}
            
            {/* Model Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Model Type Badge */}
              <Tag 
                color={typeInfo.color} 
                style={{ 
                  marginBottom: '8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  border: 'none'
                }}
              >
                {typeInfo.label}
              </Tag>
              
              {/* Model Name */}
              <Title 
                level={4} 
                style={{ 
                  margin: 0, 
                  marginBottom: '4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '20px'
                }}
                ellipsis={{ tooltip: model.name }}
              >
                {model.name}
              </Title>
              
              {/* Model Description */}
              <Text 
                type="secondary" 
                style={{ 
                  fontSize: '13px',
                  lineHeight: '18px',
                  display: 'block',
                  marginBottom: '12px'
                }}
                ellipsis={{ tooltip: model.description }}
              >
                {model.description || 'No description provided'}
              </Text>
              
              {/* Model Stats */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '8px',
                fontSize: '13px',
                color: '#666'
              }}>
                <span>
                  <BarChartOutlined style={{ marginRight: '4px' }} />
                  {model.accuracy ? `${model.accuracy}% mAP` : 'No metrics'}
                </span>
                <span>
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  {model.file_size ? `${(model.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown'}
                </span>
              </div>
              
              {/* Status and Date */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '12px',
                color: '#999'
              }}>
                <Badge 
                  status={statusInfo.status} 
                  text={statusInfo.text}
                  style={{ fontSize: '12px' }}
                />
                <span>
                  {new Date(model.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Action Menu */}
            <Dropdown 
              overlay={moreMenu} 
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text"
                icon={<MoreOutlined />}
                style={{ 
                  color: '#999',
                  border: 'none',
                  boxShadow: 'none'
                }}
              />
            </Dropdown>
          </div>
          
          {/* Training Progress (if training) */}
          {model.is_training && (
            <div style={{ marginTop: '12px' }}>
              <Text style={{ fontSize: '12px', color: '#666' }}>Training Progress</Text>
              <Progress 
                percent={model.training_progress || 0} 
                size="small"
                status="active"
                style={{ marginTop: '4px' }}
              />
            </div>
          )}
        </Card>
      </Col>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading models...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
            🤖 AI Models
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Manage your machine learning models for auto-labeling
          </Text>
        </div>
        <Space size="middle">
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadModels}
            style={{ 
              borderRadius: '6px',
              height: '36px'
            }}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<CloudUploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
            style={{ 
              borderRadius: '6px',
              height: '36px',
              fontSize: '14px',
              background: '#722ed1',
              borderColor: '#722ed1'
            }}
          >
            Upload Model
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Total Models" 
              value={models.length} 
              prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Ready Models" 
              value={models.filter(m => m.is_ready).length} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Training" 
              value={models.filter(m => m.is_training).length} 
              prefix={<ExperimentOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Custom Models" 
              value={models.filter(m => m.type === 'custom').length} 
              prefix={<SettingOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Bar */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Search
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 150 }}
          >
            <Option value="all">All Types</Option>
            <Option value="yolov8n">YOLOv8 Nano</Option>
            <Option value="yolov8s">YOLOv8 Small</Option>
            <Option value="yolov8m">YOLOv8 Medium</Option>
            <Option value="yolov8l">YOLOv8 Large</Option>
            <Option value="custom">Custom</Option>
          </Select>

          <Text type="secondary">
            {filteredModels.length} of {models.length} models
          </Text>
        </div>
      </Card>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm || filterType !== 'all' 
                ? "No models match your filters" 
                : "No models available"
            }
          >
            {!searchTerm && filterType === 'all' && (
              <Button 
                type="primary" 
                icon={<CloudUploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                Upload Your First Model
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredModels.map(renderModelCard)}
        </Row>
      )}

      {/* Upload Model Modal */}
      <Modal
        title="Upload Model"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="name"
            label="Model Name"
            rules={[{ required: true, message: 'Please enter model name' }]}
          >
            <Input placeholder="Enter model name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter model description (optional)" 
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Model Type"
            rules={[{ required: true, message: 'Please select model type' }]}
          >
            <Select placeholder="Select model type">
              {(supportedTypes || []).map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="file"
            label="Model File"
            rules={[{ required: true, message: 'Please upload model file' }]}
          >
            <Dragger
              name="file"
              multiple={false}
              beforeUpload={() => false}
              accept=".pt,.onnx,.pb"
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag model file to upload</p>
              <p className="ant-upload-hint">
                Support .pt, .onnx, .pb formats
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={uploading}
                icon={<CloudUploadOutlined />}
              >
                Upload Model
              </Button>
              <Button onClick={() => setUploadModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Model Details Modal */}
      <Modal
        title="Model Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedModel && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                    {getModelThumbnail(selectedModel)}
                    <div>
                      <Title level={3} style={{ margin: 0 }}>
                        {selectedModel.name}
                      </Title>
                      <Tag color={getModelTypeInfo(selectedModel.type).color}>
                        {getModelTypeInfo(selectedModel.type).label}
                      </Tag>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>Description:</Text>
                      <div>{selectedModel.description || 'No description'}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>File Size:</Text>
                      <div>{selectedModel.file_size ? `${(selectedModel.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>Created:</Text>
                      <div>{new Date(selectedModel.created_at).toLocaleString()}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>Status:</Text>
                      <div>
                        <Badge 
                          status={getModelStatus(selectedModel).status} 
                          text={getModelStatus(selectedModel).text}
                        />
                      </div>
                    </Col>
                  </Row>
                  
                  {selectedModel.accuracy && (
                    <>
                      <Divider />
                      <Text strong>Performance Metrics:</Text>
                      <Row gutter={[16, 16]} style={{ marginTop: '8px' }}>
                        <Col span={8}>
                          <Statistic title="mAP50" value={selectedModel.accuracy} suffix="%" />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Precision" value={selectedModel.precision || 0} suffix="%" />
                        </Col>
                        <Col span={8}>
                          <Statistic title="Recall" value={selectedModel.recall || 0} suffix="%" />
                        </Col>
                      </Row>
                    </>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModelsModern;