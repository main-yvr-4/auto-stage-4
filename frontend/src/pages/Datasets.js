import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Table, 
  Space, 
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Progress,
  Spin,
  Dropdown,
  Menu,
  Badge,
  Tag,
  Tooltip,
  Row,
  Col,
  Avatar,
  Statistic,
  Empty,
  Tabs
} from 'antd';
import {
  UploadOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  SplitCellsOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileImageOutlined,
  FolderOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { datasetsAPI, projectsAPI } from '../services/api';
import { handleAPIError } from '../utils/errorHandler';
import DatasetAnalytics from '../components/DatasetAnalytics';
import DataAugmentation from '../components/DataAugmentation';
import DatasetManagement from '../components/DatasetManagement';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;
const { TabPane } = Tabs;

const Datasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  
  // New feature states
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [augmentationVisible, setAugmentationVisible] = useState(false);
  const [managementVisible, setManagementVisible] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  
  // UI states
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Load datasets and projects
  const loadData = async () => {
    setLoading(true);
    try {
      const [datasetsData, projectsData] = await Promise.all([
        datasetsAPI.getDatasets(),
        projectsAPI.getProjects()
      ]);
      setDatasets(datasetsData);
      setProjects(projectsData);
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to load data: ${errorInfo.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter datasets by project
  const filteredDatasets = selectedProjectId === 'all' 
    ? datasets 
    : datasets.filter(dataset => dataset.project_id === selectedProjectId);

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'No Project';
  };

  // Get status info
  const getStatusInfo = (dataset) => {
    const total = dataset.total_images || 0;
    const annotated = dataset.labeled_images || 0;
    const percent = total > 0 ? Math.round((annotated / total) * 100) : 0;
    
    if (percent === 100) {
      return { status: 'Complete', color: 'success', icon: <CheckCircleOutlined /> };
    } else if (percent > 0) {
      return { status: 'In Progress', color: 'processing', icon: <ExclamationCircleOutlined /> };
    } else {
      return { status: 'Not Started', color: 'default', icon: <ExclamationCircleOutlined /> };
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <strong>{name}</strong>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : 'No Project';
      },
    },
    {
      title: 'Images',
      dataIndex: 'total_images',
      key: 'total_images',
      render: (count) => `${count || 0} images`,
    },
    {
      title: 'Annotated',
      key: 'annotated',
      render: (_, record) => {
        const total = record.total_images || 0;
        const annotated = record.labeled_images || 0;
        const percent = total > 0 ? Math.round((annotated / total) * 100) : 0;
        
        return (
          <div>
            <Progress 
              percent={percent} 
              size="small" 
              style={{ width: 100 }}
            />
            <span style={{ marginLeft: 8 }}>{annotated}/{total}</span>
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const total = record.image_count || 0;
        const annotated = record.annotated_count || 0;
        const percent = total > 0 ? Math.round((annotated / total) * 100) : 0;
        
        return (
          <Space direction="vertical" size="small">
            <div>
              {percent === 100 ? (
                <CheckCircleOutlined style={{ color: 'green' }} />
              ) : percent > 0 ? (
                <ExclamationCircleOutlined style={{ color: 'orange' }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: 'red' }} />
              )}
              <span style={{ marginLeft: 4 }}>
                {percent === 100 ? 'Complete' : percent > 0 ? 'In Progress' : 'Not Started'}
              </span>
            </div>
            {record.has_split && <Tag size="small" color="blue">Split</Tag>}
            {record.has_augmentation && <Tag size="small" color="green">Augmented</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Images">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => {
                setSelectedDatasetId(record.id);
                setManagementVisible(true);
              }}
            >
              Manage
            </Button>
          </Tooltip>
          
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="analytics" 
                  icon={<BarChartOutlined />}
                  onClick={() => {
                    setSelectedDatasetId(record.id);
                    setAnalyticsVisible(true);
                  }}
                >
                  Analytics
                </Menu.Item>
                <Menu.Item 
                  key="augmentation" 
                  icon={<ExperimentOutlined />}
                  onClick={() => {
                    setSelectedDatasetId(record.id);
                    setAugmentationVisible(true);
                  }}
                >
                  Augmentation
                </Menu.Item>
                <Menu.Item 
                  key="split" 
                  icon={<SplitCellsOutlined />}
                  onClick={() => {
                    setSelectedDatasetId(record.id);
                    setManagementVisible(true);
                  }}
                >
                  Train/Val/Test Split
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="export" icon={<DownloadOutlined />}>
                  Export
                </Menu.Item>
                <Menu.Item 
                  key="delete" 
                  icon={<DeleteOutlined />} 
                  danger
                  onClick={() => handleDelete(record.id)}
                >
                  Delete
                </Menu.Item>
              </Menu>
            }
          >
            <Button icon={<SettingOutlined />} size="small">
              More
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Handle dataset upload
  const handleUpload = async (values) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      if (values.project_id) {
        formData.append('project_id', values.project_id);
      }
      
      // Add files
      values.files.forEach(file => {
        formData.append('files', file.originFileObj);
      });

      await datasetsAPI.uploadDataset(formData);
      message.success('Dataset uploaded successfully!');
      setUploadModalVisible(false);
      form.resetFields();
      loadData(); // Reload datasets
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Upload failed: ${errorInfo.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle dataset deletion
  const handleDelete = async (datasetId) => {
    try {
      await datasetsAPI.deleteDataset(datasetId);
      message.success('Dataset deleted successfully!');
      loadData(); // Reload datasets
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Delete failed: ${errorInfo.message}`);
    }
  };

  const showUploadModal = () => {
    setUploadModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      handleUpload(values);
    });
  };

  // Render dataset card
  const renderDatasetCard = (dataset) => {
    const statusInfo = getStatusInfo(dataset);
    const total = dataset.total_images || 0;
    const annotated = dataset.labeled_images || 0;
    const percent = total > 0 ? Math.round((annotated / total) * 100) : 0;

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={dataset.id}>
        <Card
          hoverable
          style={{ 
            marginBottom: 16,
            borderRadius: 8,
            overflow: 'hidden'
          }}
          cover={
            <div style={{ 
              height: 120, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <FileImageOutlined style={{ fontSize: 48, color: 'white', opacity: 0.8 }} />
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                {total} images
              </div>
            </div>
          }
          actions={[
            <Tooltip title="Manage Dataset">
              <Button 
                type="text" 
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedDatasetId(dataset.id);
                  setManagementVisible(true);
                }}
              >
                Manage
              </Button>
            </Tooltip>,
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item 
                    key="analytics" 
                    icon={<BarChartOutlined />}
                    onClick={() => {
                      setSelectedDatasetId(dataset.id);
                      setAnalyticsVisible(true);
                    }}
                  >
                    Analytics
                  </Menu.Item>
                  <Menu.Item 
                    key="augmentation" 
                    icon={<ExperimentOutlined />}
                    onClick={() => {
                      setSelectedDatasetId(dataset.id);
                      setAugmentationVisible(true);
                    }}
                  >
                    Augmentation
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item 
                    key="delete" 
                    icon={<DeleteOutlined />} 
                    danger
                    onClick={() => handleDelete(dataset.id)}
                  >
                    Delete
                  </Menu.Item>
                </Menu>
              }
            >
              <Button type="text" icon={<SettingOutlined />}>
                More
              </Button>
            </Dropdown>
          ]}
        >
          <Card.Meta
            title={
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                  {dataset.name}
                </div>
                <Tag color="blue" size="small">
                  <FolderOutlined style={{ marginRight: 4 }} />
                  {getProjectName(dataset.project_id)}
                </Tag>
              </div>
            }
            description={
              <div>
                {dataset.description && (
                  <div style={{ 
                    color: '#666', 
                    fontSize: 12, 
                    marginBottom: 12,
                    lineHeight: 1.4
                  }}>
                    {dataset.description}
                  </div>
                )}
                
                <div style={{ marginBottom: 12 }}>
                  <Progress 
                    percent={percent} 
                    size="small"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: 4,
                    fontSize: 12
                  }}>
                    <span>{annotated}/{total} annotated</span>
                    <Badge 
                      status={statusInfo.color} 
                      text={statusInfo.status}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>
            }
          />
        </Card>
      </Col>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        background: 'white',
        padding: '24px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            <DatabaseOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            Datasets
          </Title>
          <Paragraph style={{ margin: 0, color: '#666' }}>
            Upload and manage your image datasets organized by projects
          </Paragraph>
        </div>
        <Space size="middle">
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showUploadModal}
            size="large"
          >
            Upload Dataset
          </Button>
        </Space>
      </div>

      {/* Filters and Controls */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilterOutlined />
              <span>Filter by Project:</span>
              <Select
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                style={{ minWidth: 200 }}
                placeholder="Select project"
              >
                <Option value="all">All Projects ({datasets.length})</Option>
                {projects.map(project => {
                  const projectDatasets = datasets.filter(d => d.project_id === project.id);
                  return (
                    <Option key={project.id} value={project.id}>
                      {project.name} ({projectDatasets.length})
                    </Option>
                  );
                })}
              </Select>
            </div>
            
            {selectedProjectId !== 'all' && (
              <Tag color="blue" closable onClose={() => setSelectedProjectId('all')}>
                {getProjectName(selectedProjectId)}
              </Tag>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>View:</span>
            <Button.Group>
              <Button 
                type={viewMode === 'cards' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
              <Button 
                type={viewMode === 'table' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </Button.Group>
          </div>
        </div>
      </Card>

      {/* Content */}
      <Spin spinning={loading}>
        {filteredDatasets.length === 0 ? (
          <Card>
            <Empty
              image={<DatabaseOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description={
                <div>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>
                    {selectedProjectId === 'all' 
                      ? 'No datasets uploaded yet' 
                      : `No datasets found for ${getProjectName(selectedProjectId)}`
                    }
                  </div>
                  <div style={{ color: '#666' }}>
                    Upload your first dataset to get started with annotation
                  </div>
                </div>
              }
            >
              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                size="large"
                onClick={showUploadModal}
              >
                Upload Dataset
              </Button>
            </Empty>
          </Card>
        ) : viewMode === 'cards' ? (
          <Row gutter={[16, 16]}>
            {filteredDatasets.map(renderDatasetCard)}
          </Row>
        ) : (
          <Card>
            <Table
              columns={columns}
              dataSource={filteredDatasets}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} datasets`
              }}
            />
          </Card>
        )}
      </Spin>

      <Modal
        title="Upload Dataset"
        open={uploadModalVisible}
        onOk={handleModalOk}
        onCancel={() => setUploadModalVisible(false)}
        confirmLoading={uploading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Dataset Name"
            rules={[{ required: true, message: 'Please enter dataset name' }]}
          >
            <Input placeholder="Enter dataset name" />
          </Form.Item>
          
          <Form.Item
            name="project_id"
            label="Project (Optional)"
          >
            <Select placeholder="Select project" allowClear>
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter dataset description" rows={3} />
          </Form.Item>

          <Form.Item
            name="files"
            label="Images"
            rules={[{ required: true, message: 'Please select images to upload' }]}
          >
            <Upload.Dragger
              multiple
              accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp"
              beforeUpload={() => false} // Prevent auto upload
              onChange={(info) => {
                form.setFieldsValue({ files: info.fileList });
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag images to this area to upload</p>
              <p className="ant-upload-hint">
                Support for JPG, JPEG, PNG, BMP, TIFF, WEBP formats. Max 100MB per file, up to 10,000 images.
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        title="Dataset Analytics"
        visible={analyticsVisible}
        onCancel={() => setAnalyticsVisible(false)}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        {analyticsVisible && selectedDatasetId && (
          <DatasetAnalytics 
            datasetId={selectedDatasetId} 
            onClose={() => setAnalyticsVisible(false)}
          />
        )}
      </Modal>

      {/* Data Augmentation Modal */}
      <Modal
        title="Data Augmentation"
        visible={augmentationVisible}
        onCancel={() => setAugmentationVisible(false)}
        footer={null}
        width={1400}
        style={{ top: 20 }}
      >
        {augmentationVisible && selectedDatasetId && (
          <DataAugmentation 
            datasetId={selectedDatasetId} 
            onClose={() => setAugmentationVisible(false)}
          />
        )}
      </Modal>

      {/* Dataset Management Modal */}
      <Modal
        title="Dataset Management"
        visible={managementVisible}
        onCancel={() => setManagementVisible(false)}
        footer={null}
        width={1600}
        style={{ top: 20 }}
      >
        {managementVisible && selectedDatasetId && (
          <DatasetManagement 
            datasetId={selectedDatasetId} 
            onClose={() => setManagementVisible(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Datasets;