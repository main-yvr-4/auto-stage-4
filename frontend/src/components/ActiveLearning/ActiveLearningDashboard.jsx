import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Progress,
  Statistic,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Tabs,
  Timeline,
  Alert,
  Image,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  PlusOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  ExperimentOutlined as BrainOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;

const ActiveLearningDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [progress, setProgress] = useState(null);
  const [uncertainSamples, setUncertainSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSessions();
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchProgress();
      fetchUncertainSamples();
      // Auto-refresh progress every 10 seconds during training
      const interval = setInterval(() => {
        if (selectedSession.status === 'training') {
          fetchProgress();
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/active-learning/sessions');
      setSessions(response.data);
    } catch (error) {
      message.error('Failed to fetch training sessions');
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await axios.get('/api/datasets');
      setDatasets(response.data);
    } catch (error) {
      message.error('Failed to fetch datasets');
    }
  };

  const fetchProgress = async () => {
    if (!selectedSession) return;
    
    try {
      const response = await axios.get(`/api/active-learning/sessions/${selectedSession.id}/progress`);
      setProgress(response.data);
      // Update selected session with latest data
      setSelectedSession(prev => ({ ...prev, ...response.data.session }));
    } catch (error) {
      message.error('Failed to fetch training progress');
    }
  };

  const fetchUncertainSamples = async () => {
    if (!selectedSession) return;
    
    try {
      const response = await axios.get(`/api/active-learning/sessions/${selectedSession.id}/uncertain-samples`);
      setUncertainSamples(response.data);
    } catch (error) {
      message.error('Failed to fetch uncertain samples');
    }
  };

  const createSession = async (values) => {
    try {
      setLoading(true);
      await axios.post('/api/active-learning/sessions', values);
      message.success('🎉 Training session created! Ready to start your first iteration.');
      setCreateModalVisible(false);
      form.resetFields();
      fetchSessions();
    } catch (error) {
      message.error('Failed to create training session');
    } finally {
      setLoading(false);
    }
  };

  const startIteration = async () => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      await axios.post(`/api/active-learning/sessions/${selectedSession.id}/iterations`, {
        newly_labeled_images: []
      });
      message.success(`🚀 Iteration ${selectedSession.current_iteration + 1} started! Training in progress...`);
      fetchProgress();
    } catch (error) {
      message.error('Failed to start training iteration');
    } finally {
      setLoading(false);
    }
  };

  const reviewSample = async (sampleId, accepted, corrected = false) => {
    try {
      await axios.put(`/api/active-learning/uncertain-samples/${sampleId}/review`, {
        accepted,
        corrected
      });
      const action = accepted ? (corrected ? 'corrected' : 'accepted') : 'rejected';
      message.success(`✅ Sample ${action} successfully`);
      fetchUncertainSamples();
      setReviewModalVisible(false);
    } catch (error) {
      message.error('Failed to review sample');
    }
  };

  const exportModel = async () => {
    if (!selectedSession) return;
    
    try {
      const response = await axios.get(`/api/active-learning/sessions/${selectedSession.id}/export-model`);
      message.success('🎯 Model exported successfully! Ready for production use.');
      Modal.info({
        title: 'Model Export Information',
        content: (
          <div>
            <p><strong>Model Path:</strong> {response.data.model_path}</p>
            <p><strong>Performance:</strong></p>
            <ul>
              <li>mAP50: {(response.data.performance.map50 * 100).toFixed(1)}%</li>
              <li>mAP95: {(response.data.performance.map95 * 100).toFixed(1)}%</li>
              <li>Precision: {(response.data.performance.precision * 100).toFixed(1)}%</li>
              <li>Recall: {(response.data.performance.recall * 100).toFixed(1)}%</li>
            </ul>
            <p><strong>Training Time:</strong> {response.data.training_time}s</p>
          </div>
        )
      });
    } catch (error) {
      message.error('Failed to export model');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      training: 'blue',
      completed: 'green',
      failed: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      training: <RobotOutlined spin />,
      completed: <CheckCircleOutlined />,
      failed: <ExclamationCircleOutlined />
    };
    return icons[status] || <ExclamationCircleOutlined />;
  };

  const getProgressData = () => {
    if (!progress || !progress.iterations) return [];
    
    return progress.iterations.map(iteration => ({
      iteration: `Iter ${iteration.iteration_number}`,
      'mAP50': iteration.map50 || 0,
      'mAP95': iteration.map95 || 0,
      'Precision': iteration.precision || 0,
      'Recall': iteration.recall || 0
    }));
  };

  const getUncertaintyDistribution = () => {
    if (!uncertainSamples.length) return [];
    
    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const distribution = bins.slice(0, -1).map((bin, index) => {
      const count = uncertainSamples.filter(sample => 
        sample.uncertainty_score >= bin && sample.uncertainty_score < bins[index + 1]
      ).length;
      return {
        range: `${bin.toFixed(1)}-${bins[index + 1].toFixed(1)}`,
        count,
        percentage: (count / uncertainSamples.length * 100).toFixed(1)
      };
    });
    
    return distribution;
  };

  const sessionColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => setSelectedSession(record)}
          style={{ padding: 0, fontWeight: 'bold' }}
        >
          <BrainOutlined /> {text}
        </Button>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const percent = (record.current_iteration / record.max_iterations) * 100;
        return (
          <Progress 
            percent={percent}
            size="small"
            format={() => `${record.current_iteration}/${record.max_iterations}`}
            strokeColor={percent === 100 ? '#52c41a' : '#1890ff'}
          />
        );
      }
    },
    {
      title: 'Best mAP50',
      dataIndex: 'best_map50',
      key: 'best_map50',
      render: value => value ? (
        <Tag color="green">{(value * 100).toFixed(1)}%</Tag>
      ) : (
        <Tag color="default">-</Tag>
      )
    },
    {
      title: 'Dataset',
      dataIndex: 'dataset_id',
      key: 'dataset_id',
      render: datasetId => {
        const dataset = datasets.find(d => d.id === datasetId);
        return dataset ? dataset.name : `Dataset ${datasetId}`;
      }
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => new Date(date).toLocaleDateString()
    }
  ];

  const sampleColumns = [
    {
      title: 'Image',
      dataIndex: 'image_id',
      key: 'image_id',
      render: imageId => (
        <Tag color="blue">
          <EyeOutlined /> Image {imageId}
        </Tag>
      )
    },
    {
      title: 'Uncertainty Score',
      dataIndex: 'uncertainty_score',
      key: 'uncertainty_score',
      render: score => (
        <div>
          <Progress 
            percent={score * 100} 
            size="small" 
            format={() => score.toFixed(3)}
            strokeColor={
              score > 0.8 ? '#ff4d4f' : 
              score > 0.6 ? '#faad14' : 
              score > 0.4 ? '#1890ff' : '#52c41a'
            }
          />
          <small style={{ color: '#666' }}>
            {score > 0.8 ? 'Very High' : 
             score > 0.6 ? 'High' : 
             score > 0.4 ? 'Medium' : 'Low'}
          </small>
        </div>
      )
    },
    {
      title: 'Confidence Range',
      key: 'confidence_range',
      render: (_, record) => (
        <div>
          <div>{record.min_confidence.toFixed(2)} - {record.max_confidence.toFixed(2)}</div>
          <small style={{ color: '#666' }}>
            Variance: {record.confidence_variance.toFixed(3)}
          </small>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        if (!record.reviewed) return <Tag color="orange">🔍 Needs Review</Tag>;
        if (record.accepted && record.corrected) return <Tag color="blue">✏️ Corrected</Tag>;
        if (record.accepted) return <Tag color="green">✅ Accepted</Tag>;
        return <Tag color="red">❌ Rejected</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small" 
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedSample(record);
            setReviewModalVisible(true);
          }}
          disabled={record.reviewed}
        >
          {record.reviewed ? 'Reviewed' : 'Review'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[16, 16]}>
        {/* Header */}
        <Col span={24}>
          <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <h1 style={{ color: 'white', margin: 0 }}>
                  🧠 Active Learning Dashboard
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0 0 0', fontSize: '16px' }}>
                  Train custom models iteratively with intelligent sample selection
                </p>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  New Training Session
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Quick Stats */}
        {sessions.length > 0 && (
          <Col span={24}>
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Total Sessions" 
                    value={sessions.length}
                    prefix={<ExperimentOutlined style={{ color: '#1890ff' }} />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Active Sessions" 
                    value={sessions.filter(s => s.status === 'training').length}
                    prefix={<RobotOutlined style={{ color: '#52c41a' }} />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Completed Sessions" 
                    value={sessions.filter(s => s.status === 'completed').length}
                    prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Best Performance" 
                    value={Math.max(...sessions.map(s => s.best_map50 || 0)) * 100}
                    precision={1}
                    suffix="%"
                    prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        )}

        {/* Sessions Overview */}
        <Col span={24}>
          <Card 
            title={
              <span>
                <ExperimentOutlined /> Training Sessions
              </span>
            }
            extra={
              <Button onClick={fetchSessions} loading={loading}>
                Refresh
              </Button>
            }
          >
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <BrainOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <h3 style={{ color: '#999', marginTop: '16px' }}>No Training Sessions Yet</h3>
                <p style={{ color: '#666' }}>Create your first active learning session to get started!</p>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  Create First Session
                </Button>
              </div>
            ) : (
              <Table 
                columns={sessionColumns}
                dataSource={sessions}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                rowClassName={(record) => 
                  selectedSession?.id === record.id ? 'ant-table-row-selected' : ''
                }
              />
            )}
          </Card>
        </Col>

        {/* Selected Session Details */}
        {selectedSession && (
          <Col span={24}>
            <Card 
              title={
                <span>
                  <BrainOutlined /> Session: {selectedSession.name}
                  <Tag 
                    color={getStatusColor(selectedSession.status)} 
                    style={{ marginLeft: 8 }}
                    icon={getStatusIcon(selectedSession.status)}
                  >
                    {selectedSession.status.toUpperCase()}
                  </Tag>
                </span>
              }
              extra={
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={startIteration}
                    loading={loading}
                    disabled={selectedSession.status === 'completed' || selectedSession.status === 'training'}
                  >
                    {selectedSession.current_iteration === 0 ? 'Start First Iteration' : 'Start Next Iteration'}
                  </Button>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={exportModel}
                    disabled={!selectedSession.best_map50}
                    type={selectedSession.status === 'completed' ? 'primary' : 'default'}
                  >
                    Export Best Model
                  </Button>
                </Space>
              }
            >
              <Tabs defaultActiveKey="progress">
                <TabPane tab={<span><TrophyOutlined />Progress</span>} key="progress">
                  {progress && (
                    <Row gutter={[16, 16]}>
                      {/* Key Metrics */}
                      <Col span={24}>
                        <Row gutter={16}>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic 
                                title="Current Iteration" 
                                value={progress.session.current_iteration}
                                suffix={`/ ${progress.session.max_iterations}`}
                                prefix={<ExperimentOutlined style={{ color: '#1890ff' }} />}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic 
                                title="Best mAP50" 
                                value={progress.session.best_map50 * 100}
                                precision={1}
                                suffix="%"
                                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic 
                                title="Best mAP95" 
                                value={progress.session.best_map95 * 100}
                                precision={1}
                                suffix="%"
                                prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic 
                                title="Total Training Time" 
                                value={progress.iterations.reduce((sum, it) => sum + (it.training_time_seconds || 0), 0)}
                                suffix="sec"
                                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                              />
                            </Card>
                          </Col>
                        </Row>
                      </Col>

                      {/* Performance Chart */}
                      {getProgressData().length > 0 && (
                        <Col span={24}>
                          <Card title="📈 Performance Metrics Over Iterations" size="small">
                            <Line
                              data={getProgressData().flatMap(item => 
                                Object.entries(item).filter(([key]) => key !== 'iteration').map(([metric, value]) => ({
                                  iteration: item.iteration,
                                  metric,
                                  value
                                }))
                              )}
                              xField="iteration"
                              yField="value"
                              seriesField="metric"
                              height={300}
                              smooth={true}
                              point={{ size: 5 }}
                              legend={{ position: 'top' }}
                              yAxis={{ min: 0, max: 1 }}
                              color={['#1890ff', '#52c41a', '#faad14', '#722ed1']}
                              meta={{
                                value: { alias: 'Score' },
                                iteration: { alias: 'Iteration' }
                              }}
                            />
                          </Card>
                        </Col>
                      )}

                      {/* Training Timeline */}
                      <Col span={24}>
                        <Card title="🕐 Training Timeline" size="small">
                          <Timeline>
                            {progress.iterations.map(iteration => (
                              <Timeline.Item 
                                key={iteration.iteration_number}
                                color={getStatusColor(iteration.status)}
                                dot={getStatusIcon(iteration.status)}
                              >
                                <div>
                                  <strong>Iteration {iteration.iteration_number}</strong>
                                  <Tag 
                                    color={getStatusColor(iteration.status)} 
                                    style={{ marginLeft: 8 }}
                                  >
                                    {iteration.status}
                                  </Tag>
                                  {iteration.map50 && (
                                    <div style={{ marginTop: 4 }}>
                                      <Row gutter={16}>
                                        <Col span={6}>
                                          <small>mAP50: <strong>{(iteration.map50 * 100).toFixed(1)}%</strong></small>
                                        </Col>
                                        <Col span={6}>
                                          <small>mAP95: <strong>{(iteration.map95 * 100).toFixed(1)}%</strong></small>
                                        </Col>
                                        <Col span={6}>
                                          <small>Precision: <strong>{(iteration.precision * 100).toFixed(1)}%</strong></small>
                                        </Col>
                                        <Col span={6}>
                                          <small>Recall: <strong>{(iteration.recall * 100).toFixed(1)}%</strong></small>
                                        </Col>
                                      </Row>
                                      {iteration.training_time_seconds && (
                                        <div style={{ marginTop: 4 }}>
                                          <small>Training time: <strong>{iteration.training_time_seconds}s</strong></small>
                                          <small style={{ marginLeft: 16 }}>
                                            Images: <strong>{iteration.training_images_count}</strong> train, 
                                            <strong> {iteration.validation_images_count}</strong> val
                                          </small>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Timeline.Item>
                            ))}
                          </Timeline>
                        </Card>
                      </Col>
                    </Row>
                  )}
                </TabPane>

                <TabPane tab={<span><EyeOutlined />Uncertain Samples ({uncertainSamples.length})</span>} key="samples">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Alert
                        message="🎯 Review High-Uncertainty Samples"
                        description="These images have high uncertainty scores and would benefit most from manual labeling to improve the model. Focus on the highest uncertainty samples first."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    </Col>

                    {/* Uncertainty Distribution */}
                    {uncertainSamples.length > 0 && (
                      <Col span={24}>
                        <Card title="📊 Uncertainty Score Distribution" size="small">
                          <Column
                            data={getUncertaintyDistribution()}
                            xField="range"
                            yField="count"
                            height={200}
                            color="#1890ff"
                            meta={{
                              count: { alias: 'Number of Samples' },
                              range: { alias: 'Uncertainty Range' }
                            }}
                          />
                        </Card>
                      </Col>
                    )}

                    <Col span={24}>
                      {uncertainSamples.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <EyeOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                          <h3 style={{ color: '#999', marginTop: '16px' }}>No Uncertain Samples Yet</h3>
                          <p style={{ color: '#666' }}>
                            Complete a training iteration to generate uncertain samples for review.
                          </p>
                        </div>
                      ) : (
                        <Table 
                          columns={sampleColumns}
                          dataSource={uncertainSamples}
                          rowKey="id"
                          pagination={{ 
                            pageSize: 20,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                              `${range[0]}-${range[1]} of ${total} uncertain samples`
                          }}
                          scroll={{ x: 800 }}
                        />
                      )}
                    </Col>
                  </Row>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        )}
      </Row>

      {/* Create Session Modal */}
      <Modal
        title={
          <span>
            <BrainOutlined /> Create New Active Learning Session
          </span>
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Alert
          message="🚀 Start Your Active Learning Journey"
          description="Create a training session to iteratively improve your model with intelligent sample selection. Perfect for complex defects, custom objects, and domain-specific detection tasks."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={createSession}
        >
          <Form.Item
            name="name"
            label="Session Name"
            rules={[{ required: true, message: 'Please enter session name' }]}
          >
            <Input 
              placeholder="e.g., Industrial Defect Detection v1" 
              prefix={<ExperimentOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              placeholder="Describe your training objective and expected outcomes..."
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="dataset_id"
            label="Dataset"
            rules={[{ required: true, message: 'Please select a dataset' }]}
          >
            <Select placeholder="Select dataset for training">
              {datasets.map(dataset => (
                <Option key={dataset.id} value={dataset.id}>
                  📁 {dataset.name} ({dataset.image_count || 0} images)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Training Configuration</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="epochs"
                label="Epochs per Iteration"
                initialValue={50}
                tooltip="Number of training epochs for each iteration"
              >
                <InputNumber 
                  min={10} 
                  max={200} 
                  style={{ width: '100%' }}
                  formatter={value => `${value} epochs`}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="batch_size"
                label="Batch Size"
                initialValue={16}
                tooltip="Number of images processed together"
              >
                <InputNumber 
                  min={1} 
                  max={64} 
                  style={{ width: '100%' }}
                  formatter={value => `${value} images`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="learning_rate"
                label="Learning Rate"
                initialValue={0.001}
                tooltip="Controls how fast the model learns"
              >
                <InputNumber 
                  min={0.0001} 
                  max={0.1} 
                  step={0.0001} 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_iterations"
                label="Max Iterations"
                initialValue={10}
                tooltip="Maximum number of active learning iterations"
              >
                <InputNumber 
                  min={1} 
                  max={20} 
                  style={{ width: '100%' }}
                  formatter={value => `${value} iterations`}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                🚀 Create Session
              </Button>
              <Button onClick={() => setCreateModalVisible(false)} size="large">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Review Sample Modal */}
      <Modal
        title={
          <span>
            <EyeOutlined /> Review Uncertain Sample
          </span>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedSample && (
          <div>
            <Alert
              message="🎯 High-Uncertainty Sample Detected"
              description="This image has high prediction uncertainty. Your review will help improve the model's performance on similar cases."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="📊 Sample Information" size="small">
                  <Row gutter={[8, 8]}>
                    <Col span={24}>
                      <strong>Image ID:</strong> {selectedSample.image_id}
                    </Col>
                    <Col span={24}>
                      <strong>Uncertainty Score:</strong> 
                      <Progress 
                        percent={selectedSample.uncertainty_score * 100}
                        size="small"
                        format={() => selectedSample.uncertainty_score.toFixed(3)}
                        strokeColor={
                          selectedSample.uncertainty_score > 0.8 ? '#ff4d4f' : 
                          selectedSample.uncertainty_score > 0.6 ? '#faad14' : '#1890ff'
                        }
                        style={{ marginLeft: 8 }}
                      />
                    </Col>
                    <Col span={12}>
                      <strong>Min Confidence:</strong> {selectedSample.min_confidence.toFixed(3)}
                    </Col>
                    <Col span={12}>
                      <strong>Max Confidence:</strong> {selectedSample.max_confidence.toFixed(3)}
                    </Col>
                    <Col span={12}>
                      <strong>Variance:</strong> {selectedSample.confidence_variance.toFixed(3)}
                    </Col>
                    <Col span={12}>
                      <strong>Entropy:</strong> {selectedSample.entropy_score.toFixed(3)}
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="🎯 Review Actions" size="small">
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Button 
                      type="primary" 
                      block
                      size="large"
                      onClick={() => reviewSample(selectedSample.id, true)}
                      style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    >
                      ✅ Accept Prediction
                      <br />
                      <small>The model's prediction is correct</small>
                    </Button>
                    
                    <Button 
                      block
                      size="large"
                      onClick={() => reviewSample(selectedSample.id, true, true)}
                      style={{ background: '#1890ff', borderColor: '#1890ff', color: 'white' }}
                    >
                      ✏️ Accept with Corrections
                      <br />
                      <small>Mostly correct but needs minor adjustments</small>
                    </Button>
                    
                    <Button 
                      danger 
                      block
                      size="large"
                      onClick={() => reviewSample(selectedSample.id, false)}
                    >
                      ❌ Reject Prediction
                      <br />
                      <small>The prediction is incorrect</small>
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActiveLearningDashboard;