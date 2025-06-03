import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
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
  message,
  Progress
} from 'antd';
import {
  ProjectOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, handleAPIError } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">
            Open
          </Button>
          <Button icon={<EditOutlined />} size="small">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      console.log('Form values:', values);
      setCreateModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>Projects</Title>
          <Paragraph>
            Organize your labeling work into projects
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Create Project
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <ProjectOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div>No projects created yet</div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  style={{ marginTop: 16 }}
                  onClick={handleCreate}
                >
                  Create Your First Project
                </Button>
              </div>
            )
          }}
        />
      </Card>

      <Modal
        title="Create Project"
        open={createModalVisible}
        onOk={handleModalOk}
        onCancel={() => setCreateModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter project description" rows={3} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Project Type"
            rules={[{ required: true, message: 'Please select project type' }]}
          >
            <Select placeholder="Select project type">
              <Option value="object_detection">Object Detection</Option>
              <Option value="classification">Image Classification</Option>
              <Option value="segmentation">Instance Segmentation</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="classes"
            label="Class Names"
            rules={[{ required: true, message: 'Please enter class names' }]}
          >
            <Select
              mode="tags"
              placeholder="Enter class names (press Enter to add)"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;