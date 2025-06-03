import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Statistic,
  Row,
  Col,
  Tabs,
  Select,
  Tooltip,
  Popconfirm,
  Badge
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  FolderOutlined,
  FileImageOutlined,
  TagsOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { Dragger } = Upload;

const DatasetManager = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with API calls
  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      // Mock API call
      const mockDatasets = [
        {
          id: 1,
          name: "Traffic Signs Dataset",
          description: "Comprehensive traffic signs detection dataset",
          created_at: "2024-01-15",
          updated_at: "2024-01-20",
          image_count: 1250,
          annotation_count: 3420,
          class_count: 15,
          status: "active",
          progress: 85,
          size: "2.3 GB",
          format: ["COCO", "YOLO"],
          tags: ["traffic", "detection", "autonomous"],
          annotated_images: 1062,
          quality_score: 92
        },
        {
          id: 2,
          name: "Medical X-Ray Analysis",
          description: "Chest X-ray abnormality detection",
          created_at: "2024-01-10",
          updated_at: "2024-01-18",
          image_count: 850,
          annotation_count: 1200,
          class_count: 8,
          status: "in_progress",
          progress: 65,
          size: "1.8 GB",
          format: ["COCO", "Pascal VOC"],
          tags: ["medical", "xray", "classification"],
          annotated_images: 553,
          quality_score: 88
        },
        {
          id: 3,
          name: "Retail Product Recognition",
          description: "Product detection for retail automation",
          created_at: "2024-01-05",
          updated_at: "2024-01-22",
          image_count: 2100,
          annotation_count: 8500,
          class_count: 45,
          status: "completed",
          progress: 100,
          size: "4.1 GB",
          format: ["COCO", "YOLO", "CVAT"],
          tags: ["retail", "products", "detection"],
          annotated_images: 2100,
          quality_score: 95
        }
      ];
      setDatasets(mockDatasets);
    } catch (error) {
      message.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async (values) => {
    try {
      // Mock API call
      const newDataset = {
        id: Date.now(),
        ...values,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        image_count: 0,
        annotation_count: 0,
        class_count: 0,
        status: "active",
        progress: 0,
        size: "0 MB",
        format: [],
        annotated_images: 0,
        quality_score: 0
      };
      
      setDatasets([...datasets, newDataset]);
      setShowCreateModal(false);
      form.resetFields();
      message.success('Dataset created successfully!');
    } catch (error) {
      message.error('Failed to create dataset');
    }
  };

  const handleDeleteDataset = async (id) => {
    try {
      setDatasets(datasets.filter(d => d.id !== id));
      message.success('Dataset deleted successfully!');
    } catch (error) {
      message.error('Failed to delete dataset');
    }
  };

  const handleBatchUpload = async (info) => {
    const { fileList } = info;
    
    if (fileList.length > 0) {
      message.success(`${fileList.length} images uploaded successfully!`);
      setShowUploadModal(false);
      uploadForm.resetFields();
      // Refresh datasets
      loadDatasets();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'active': return 'orange';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'in_progress': return <ClockCircleOutlined />;
      case 'active': return <EditOutlined />;
      default: return <FolderOutlined />;
    }
  };

  const columns = [
    {
      title: 'Dataset',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.description}</div>
          <div style={{ marginTop: 4 }}>
            {record.tags.map(tag => (
              <Tag key={tag} size="small">{tag}</Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
          <div style={{ marginTop: 4 }}>
            <Progress 
              percent={record.progress} 
              size="small" 
              status={status === 'completed' ? 'success' : 'active'}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Statistics',
      key: 'stats',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12 }}>
            <FileImageOutlined /> {record.image_count} images
          </div>
          <div style={{ fontSize: 12 }}>
            <TagsOutlined /> {record.annotation_count} annotations
          </div>
          <div style={{ fontSize: 12 }}>
            <BarChartOutlined /> {record.class_count} classes
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Quality: <Badge 
              count={`${record.quality_score}%`} 
              style={{ backgroundColor: record.quality_score > 90 ? '#52c41a' : record.quality_score > 80 ? '#faad14' : '#ff4d4f' }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Size & Format',
      key: 'format',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{record.size}</div>
          <div>
            {record.format.map(fmt => (
              <Tag key={fmt} color="blue" size="small">{fmt}</Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => (
        <div style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Dataset">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => setSelectedDataset(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Dataset">
            <Button 
              icon={<EditOutlined />} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="Download Dataset">
            <Button 
              icon={<DownloadOutlined />} 
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this dataset?"
            onConfirm={() => handleDeleteDataset(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Dataset">
              <Button 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const overviewStats = {
    totalDatasets: datasets.length,
    totalImages: datasets.reduce((sum, d) => sum + d.image_count, 0),
    totalAnnotations: datasets.reduce((sum, d) => sum + d.annotation_count, 0),
    avgQuality: Math.round(datasets.reduce((sum, d) => sum + d.quality_score, 0) / datasets.length) || 0,
    completedDatasets: datasets.filter(d => d.status === 'completed').length,
    totalSize: datasets.reduce((sum, d) => sum + parseFloat(d.size), 0).toFixed(1)
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0 }}>📊 Dataset Management</h2>
            <p style={{ margin: 0, color: '#666' }}>
              Organize and manage your annotation datasets
            </p>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                onClick={() => setShowUploadModal(true)}
              >
                Batch Upload
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Dataset
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Overview Statistics */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Total Datasets"
              value={overviewStats.totalDatasets}
              prefix={<FolderOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Total Images"
              value={overviewStats.totalImages}
              prefix={<FileImageOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Total Annotations"
              value={overviewStats.totalAnnotations}
              prefix={<TagsOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Avg Quality"
              value={overviewStats.avgQuality}
              suffix="%"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Completed"
              value={overviewStats.completedDatasets}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Total Size"
              value={overviewStats.totalSize}
              suffix="GB"
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="📋 All Datasets" key="overview">
          <Card>
            <Table
              columns={columns}
              dataSource={datasets}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} datasets`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="📈 Analytics" key="analytics">
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <BarChartOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              <h3>Dataset Analytics</h3>
              <p>Detailed analytics and insights coming soon!</p>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="🔍 Quality Assurance" key="quality">
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
              <h3>Quality Assurance</h3>
              <p>Annotation quality checks and validation tools coming soon!</p>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* Create Dataset Modal */}
      <Modal
        title="Create New Dataset"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateDataset}
        >
          <Form.Item
            name="name"
            label="Dataset Name"
            rules={[{ required: true, message: 'Please enter dataset name' }]}
          >
            <Input placeholder="Enter dataset name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Describe your dataset"
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select
              mode="tags"
              placeholder="Add tags (press Enter to add)"
              style={{ width: '100%' }}
            >
              <Option value="detection">Detection</Option>
              <Option value="classification">Classification</Option>
              <Option value="segmentation">Segmentation</Option>
              <Option value="medical">Medical</Option>
              <Option value="automotive">Automotive</Option>
              <Option value="retail">Retail</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Dataset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Upload Modal */}
      <Modal
        title="Batch Upload Images"
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={uploadForm}
          layout="vertical"
        >
          <Form.Item
            name="dataset"
            label="Select Dataset"
            rules={[{ required: true, message: 'Please select a dataset' }]}
          >
            <Select placeholder="Choose dataset">
              {datasets.map(dataset => (
                <Option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="images"
            label="Upload Images"
          >
            <Dragger
              multiple
              accept="image/*"
              onChange={handleBatchUpload}
              beforeUpload={() => false} // Prevent auto upload
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag images to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for multiple image files. Supports JPG, PNG, GIF formats.
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Upload Images
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Dataset Detail Modal */}
      {selectedDataset && (
        <Modal
          title={`Dataset: ${selectedDataset.name}`}
          open={!!selectedDataset}
          onCancel={() => setSelectedDataset(null)}
          footer={null}
          width={800}
        >
          <div>
            <p>{selectedDataset.description}</p>
            
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Statistic
                  title="Images"
                  value={selectedDataset.image_count}
                  prefix={<FileImageOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Annotations"
                  value={selectedDataset.annotation_count}
                  prefix={<TagsOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Classes"
                  value={selectedDataset.class_count}
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 16 }}>
              <h4>Export Formats:</h4>
              {selectedDataset.format.map(fmt => (
                <Tag key={fmt} color="blue">{fmt}</Tag>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <h4>Tags:</h4>
              {selectedDataset.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DatasetManager;