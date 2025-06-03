import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Switch,
  Slider,
  Select,
  Button,
  Space,
  Divider,
  Typography,
  Collapse,
  Alert,
  Progress,
  Table,
  Tag,
  Modal,
  Tooltip,
  Badge,
  Spin,
  Statistic
} from 'antd';
import {
  ExperimentOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const DataAugmentation = ({ datasetId, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState({});
  const [defaultConfig, setDefaultConfig] = useState({});
  const [augmentationJobs, setAugmentationJobs] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('medium');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    loadPresets();
    loadDefaultConfig();
    loadAugmentationJobs();
  }, [datasetId]);

  const loadPresets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/augmentation/presets`);
      const data = await response.json();
      setPresets(data.presets);
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const loadDefaultConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/augmentation/default-config`);
      const data = await response.json();
      setDefaultConfig(data);
      form.setFieldsValue(data.config);
    } catch (error) {
      console.error('Error loading default config:', error);
    }
  };

  const loadAugmentationJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/augmentation/jobs/${datasetId}`);
      const data = await response.json();
      setAugmentationJobs(data.jobs);
    } catch (error) {
      console.error('Error loading augmentation jobs:', error);
    }
  };

  const handlePresetChange = (presetName) => {
    setSelectedPreset(presetName);
    if (presets[presetName]) {
      form.setFieldsValue(presets[presetName].config);
    }
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      const response = await fetch(`${API_BASE_URL}/api/augmentation/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          augmentation_config: values,
          images_per_original: values.images_per_original || 5,
          apply_to_split: values.apply_to_split || 'train'
        })
      });
      const data = await response.json();
      setPreviewData(data);
      setPreviewVisible(true);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleCreateAugmentation = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const response = await fetch(`${API_BASE_URL}/api/augmentation/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          name: values.name || `Augmentation ${new Date().toLocaleString()}`,
          description: values.description || '',
          augmentation_config: values,
          images_per_original: values.images_per_original || 5,
          apply_to_split: values.apply_to_split || 'train',
          preserve_annotations: values.preserve_annotations !== false
        })
      });
      
      if (response.ok) {
        loadAugmentationJobs();
        Modal.success({
          title: 'Augmentation Job Created',
          content: 'Data augmentation job has been created and started successfully.'
        });
      }
    } catch (error) {
      console.error('Error creating augmentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAugmentationCategory = (categoryName, augmentations) => {
    const categoryTitles = {
      geometric: 'Geometric Transformations',
      color: 'Color Adjustments',
      noise_blur: 'Noise & Blur Effects',
      weather: 'Weather Effects',
      cutout: 'Cutout Techniques',
      distortion: 'Advanced Distortions',
      quality: 'Quality Degradation'
    };

    return (
      <Panel header={categoryTitles[categoryName] || categoryName} key={categoryName}>
        <Row gutter={[16, 16]}>
          {augmentations.map(augName => (
            <Col span={12} key={augName}>
              <Card size="small" title={augName.replace('_', ' ').toUpperCase()}>
                <Form.Item name={[augName, 'enabled']} valuePropName="checked" noStyle>
                  <Switch 
                    checkedChildren="ON" 
                    unCheckedChildren="OFF"
                    style={{ marginBottom: 8 }}
                  />
                </Form.Item>
                
                <Form.Item 
                  noStyle 
                  shouldUpdate={(prevValues, currentValues) => 
                    prevValues[augName]?.enabled !== currentValues[augName]?.enabled
                  }
                >
                  {({ getFieldValue }) => {
                    const isEnabled = getFieldValue([augName, 'enabled']);
                    if (!isEnabled) return null;
                    
                    return (
                      <div>
                        <Form.Item 
                          name={[augName, 'probability']} 
                          label="Probability"
                          initialValue={0.5}
                        >
                          <Slider min={0} max={1} step={0.1} />
                        </Form.Item>
                        
                        {renderAugmentationSpecificControls(augName)}
                      </div>
                    );
                  }}
                </Form.Item>
              </Card>
            </Col>
          ))}
        </Row>
      </Panel>
    );
  };

  const renderAugmentationSpecificControls = (augName) => {
    switch (augName) {
      case 'rotation':
        return (
          <Form.Item name={[augName, 'range']} label="Rotation Range (degrees)" initialValue={[-15, 15]}>
            <Slider range min={-180} max={180} />
          </Form.Item>
        );
      
      case 'brightness':
      case 'contrast':
      case 'saturation':
        return (
          <Form.Item name={[augName, 'range']} label="Adjustment Range" initialValue={[0.8, 1.2]}>
            <Slider range min={0.1} max={2.0} step={0.1} />
          </Form.Item>
        );
      
      case 'hue':
        return (
          <Form.Item name={[augName, 'range']} label="Hue Shift Range" initialValue={[-0.1, 0.1]}>
            <Slider range min={-0.5} max={0.5} step={0.05} />
          </Form.Item>
        );
      
      case 'gaussian_blur':
        return (
          <Form.Item name={[augName, 'kernel_size']} label="Kernel Size Range" initialValue={[3, 7]}>
            <Slider range min={1} max={15} step={2} />
          </Form.Item>
        );
      
      case 'gaussian_noise':
        return (
          <Form.Item name={[augName, 'std']} label="Noise Std Range" initialValue={[0.01, 0.05]}>
            <Slider range min={0.001} max={0.1} step={0.001} />
          </Form.Item>
        );
      
      case 'cutout':
        return (
          <>
            <Form.Item name={[augName, 'num_holes']} label="Number of Holes" initialValue={[1, 3]}>
              <Slider range min={1} max={10} />
            </Form.Item>
            <Form.Item name={[augName, 'hole_size']} label="Hole Size (ratio)" initialValue={[0.1, 0.3]}>
              <Slider range min={0.05} max={0.5} step={0.05} />
            </Form.Item>
          </>
        );
      
      case 'crop':
        return (
          <Form.Item name={[augName, 'scale']} label="Crop Scale Range" initialValue={[0.8, 1.0]}>
            <Slider range min={0.1} max={1.0} step={0.1} />
          </Form.Item>
        );
      
      case 'zoom':
        return (
          <Form.Item name={[augName, 'range']} label="Zoom Range" initialValue={[0.9, 1.1]}>
            <Slider range min={0.5} max={2.0} step={0.1} />
          </Form.Item>
        );
      
      default:
        return null;
    }
  };

  const renderJobsTable = () => {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const colors = {
            pending: 'orange',
            processing: 'blue',
            completed: 'green',
            failed: 'red'
          };
          const icons = {
            pending: <LoadingOutlined />,
            processing: <LoadingOutlined />,
            completed: <CheckCircleOutlined />,
            failed: <ExperimentOutlined />
          };
          return (
            <Tag color={colors[status]} icon={icons[status]}>
              {status.toUpperCase()}
            </Tag>
          );
        }
      },
      {
        title: 'Progress',
        dataIndex: 'progress',
        key: 'progress',
        render: (progress) => <Progress percent={progress} size="small" />
      },
      {
        title: 'Images/Original',
        dataIndex: 'images_per_original',
        key: 'images_per_original'
      },
      {
        title: 'Apply To',
        dataIndex: 'apply_to_split',
        key: 'apply_to_split',
        render: (split) => <Tag color="blue">{split.toUpperCase()}</Tag>
      },
      {
        title: 'Generated',
        dataIndex: 'total_augmented_images',
        key: 'total_augmented_images',
        render: (count) => <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date) => new Date(date).toLocaleDateString()
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Tooltip title="View Details">
              <Button icon={<EyeOutlined />} size="small" />
            </Tooltip>
            <Tooltip title="Delete">
              <Button 
                icon={<DeleteOutlined />} 
                size="small" 
                danger
                onClick={() => handleDeleteJob(record.id)}
              />
            </Tooltip>
          </Space>
        )
      }
    ];

    return (
      <Table
        dataSource={augmentationJobs}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        size="small"
      />
    );
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/augmentation/job/${jobId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadAugmentationJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>
          <ExperimentOutlined /> Data Augmentation
        </Title>
        <Button onClick={onClose}>Close</Button>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="Augmentation Configuration" size="small">
            <Form form={form} layout="vertical">
              {/* Basic Settings */}
              <Card size="small" title="Basic Settings" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="name" label="Job Name">
                      <Input placeholder="Enter augmentation job name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="description" label="Description">
                      <Input placeholder="Optional description" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="images_per_original" label="Images per Original" initialValue={5}>
                      <InputNumber min={1} max={20} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="apply_to_split" label="Apply to Split" initialValue="train">
                      <Select>
                        <Option value="train">Train</Option>
                        <Option value="val">Validation</Option>
                        <Option value="test">Test</Option>
                        <Option value="all">All</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="preserve_annotations" label="Preserve Annotations" valuePropName="checked" initialValue={true}>
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Preset Selection */}
              <Card size="small" title="Quick Presets" style={{ marginBottom: 16 }}>
                <Space wrap>
                  {Object.entries(presets).map(([name, preset]) => (
                    <Button
                      key={name}
                      type={selectedPreset === name ? 'primary' : 'default'}
                      onClick={() => handlePresetChange(name)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </Space>
                {presets[selectedPreset] && (
                  <Alert
                    message={presets[selectedPreset].description}
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Card>

              {/* Augmentation Categories */}
              {defaultConfig.categories && (
                <Collapse defaultActiveKey={['geometric', 'color']}>
                  {Object.entries(defaultConfig.categories).map(([category, augmentations]) =>
                    renderAugmentationCategory(category, augmentations)
                  )}
                </Collapse>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Space>
                  <Button icon={<EyeOutlined />} onClick={handlePreview}>
                    Preview
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />} 
                    loading={loading}
                    onClick={handleCreateAugmentation}
                  >
                    Start Augmentation
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* Quick Stats */}
            <Card title="Quick Info" size="small">
              <Paragraph>
                <InfoCircleOutlined /> Data augmentation increases dataset size and diversity, 
                improving model generalization and reducing overfitting.
              </Paragraph>
              <Divider />
              <Text strong>Tips:</Text>
              <ul style={{ fontSize: '12px', marginTop: 8 }}>
                <li>Start with light augmentations for high-quality datasets</li>
                <li>Use heavy augmentations for small datasets</li>
                <li>Geometric augmentations preserve object shapes</li>
                <li>Color augmentations help with lighting variations</li>
                <li>Weather effects simulate real-world conditions</li>
              </ul>
            </Card>

            {/* Augmentation Jobs */}
            <Card title="Recent Jobs" size="small">
              {augmentationJobs.length > 0 ? (
                renderJobsTable()
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">No augmentation jobs yet</Text>
                </div>
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Preview Modal */}
      <Modal
        title="Augmentation Preview"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewData && (
          <div>
            <Alert
              message={`Will generate ${previewData.estimated_output_images} augmented images`}
              description={`Enabled augmentations: ${previewData.enabled_augmentations.join(', ')}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Title level={5}>Configuration Summary:</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Total Enabled" value={previewData.config_summary.total_enabled} />
              </Col>
              <Col span={8}>
                <Statistic title="Intensity" value={previewData.config_summary.intensity} />
              </Col>
              <Col span={8}>
                <Statistic title="Sample Images" value={previewData.sample_images.length} />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataAugmentation;