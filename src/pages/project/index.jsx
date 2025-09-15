import { useRef, useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { Plus } from "@taroify/icons";
import {
  Button,
  Cell,
  Dialog,
  FloatingBubble,
  Form,
  Input,
  List,
  Loading,
  Navbar,
  Popup,
  Space,
} from "@taroify/core";
import CTabBar from "../../components/CTabBar";
import "./index.scss";

export default function Project() {
  const [hasMore, setHasMore] = useState(true);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const formRef = useRef();

  useLoad(() => {
    if (!Taro.getStorageSync("token")) {
      Taro.redirectTo({
        url: "/pages/login/index",
      });
    }
  });

  const onChangeTabItem = (value) => {
    if (value === 1) {
      Taro.navigateTo({
        url: "/pages/my/index",
      });
    }
  };

  // 获取项目列表
  const getProjectList = () => {
    Taro.$request({
      url: "/project/project",
      method: "GET",
      data: {
        pageIndex: 1,
        pageSize: 1000,
      },
    })
      .then((res) => {
        if (res.data?.code === 200) {
          const newList = res.data?.data?.list || [];
          setList(newList);
          setHasMore(false);
        } else {
          Taro.showToast({
            title: res.data?.msg || "业务错误",
            icon: "none",
          });
        }
      }).finally(() => {
        setLoading(false);
      });
  };

  const onLoad = () => {
    setLoading(true);
    getProjectList();
  };

  // 进入项目
  const onDetail = (data) => {
    Taro.navigateTo({
      url: `/pages/detail/index?projectCode=${data.projectCode}`,
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit("updateProjectData", data);
      },
    });
  };

  // 删除项目
  const onDelete = (data) => {
    Dialog.confirm({
      title: "删除项目",
      message: `确认要删除${data.projectName}吗？`,
      onConfirm() {
        deleteProject(data);
      },
    });
  };

  // 调用删除接口
  const deleteProject = (data) => {
    Taro.$request({
      url: "/project/project",
      method: "DELETE",
      data: {
        projectCode: data.projectCode,
      },
    })
      .then((res) => {
        if (res.data?.code === 200) {
          Taro.showToast({
            title: "删除成功",
            icon: "none",
          });
          getProjectList();
        } else {
          Taro.showToast({
            title: res.data?.msg || "业务错误",
            icon: "none",
          });
        }
      });
  };

  // 创建项目
  const onSubmit = (event) => {
    const formData = event.detail.value;
    Taro.$request({
      url: "/project/project",
      method: "POST",
      data: {
        projectName: formData.projectName,
        projectCode: formData.projectCode,
        type: formData.type,
        openbidTime: getCurrentTime(),
        openbidStatus: 0,
        decryptStatus: 0,
      },
    })
      .then((res) => {
        if (res.data?.code === 200) {
          Taro.showToast({
            title: "创建成功",
            icon: "none",
          });
          getProjectList();
          setPopupOpen(false);
          formRef.current.reset();
        } else {
          Taro.showToast({
            title: res.data?.msg || "业务错误",
            icon: "none",
          });
        }
      });
  };

  // 获取当前时间
  const getCurrentTime = () => {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let datee = date.getDate();
    let hour = date.getHours();
    hour = hour < 10 ? "0" + hour : hour;
    let minute = date.getMinutes();
    minute = minute < 10 ? "0" + minute : minute;
    let second = date.getSeconds();
    second = second < 10 ? "0" + second : second;
    return `${year}-${month}-${datee} ${hour}:${minute}:${second}`;
  };

  return (
    <View className="project-page">
      <FloatingBubble
        offset={{
          x: 12,
          y: 360,
        }}
        icon={<Plus />}
        onClick={() => setPopupOpen(true)}
      />
      <List loading={loading} hasMore={hasMore} onLoad={onLoad}>
        <Space direction="vertical" fill={true}>
          {list.map((item) => (
            <View className="project-item" key={item.id}>
              <Cell title="项目名称：">
                <View className="taroify-ellipsis--l2">
                  {item.projectName}
                </View>
              </Cell>
              <Cell title="项目名称：">
                <View className="taroify-ellipsis--l2">
                  {item.projectCode}
                </View>
              </Cell>
              <Cell title="开标时间：" align="end">{item.openbidTime}</Cell>
              <Cell title="类型：" align="end">{item.type}</Cell>
              <View className="btn-wrapper">
                <Button
                  variant="outlined"
                  color="danger"
                  size="mini"
                  onClick={() => onDelete(item)}
                >
                  删除项目
                </Button>
                <Button
                  color="primary"
                  size="mini"
                  onClick={() => onDetail(item)}
                >
                  进入项目
                </Button>
              </View>
            </View>
          ))}
        </Space>
        <List.Placeholder>
          {loading && <Loading>加载中...</Loading>}
          {!hasMore && "没有更多了"}
        </List.Placeholder>
      </List>
      <Popup
        open={popupOpen}
        rounded={true}
        placement="bottom"
        onClose={() => setPopupOpen(false)}
      >
        <Navbar>
          <Navbar.Title>新增项目</Navbar.Title>
          <Navbar.NavRight icon={<Popup.Close />} />
        </Navbar>
        <Form ref={formRef} validateTrigger="onChange" onSubmit={onSubmit}>
          <Cell.Group inset>
            <Form.Item
              name="projectName"
              rules={[{ required: true, message: "请输入项目名称" }]}
            >
              <Form.Label>项目名称</Form.Label>
              <Form.Control>
                <Input placeholder="请输入项目名称" />
              </Form.Control>
            </Form.Item>
            <Form.Item
              name="projectCode"
              rules={[{ required: true, message: "请输入项目编号" }]}
            >
              <Form.Label>项目编号</Form.Label>
              <Form.Control>
                <Input placeholder="请输入项目编号" />
              </Form.Control>
            </Form.Item>
            <Form.Item
              name="type"
              rules={[{ required: true, message: "请输入行业类型" }]}
            >
              <Form.Label>行业类型</Form.Label>
              <Form.Control>
                <Input placeholder="请输入行业类型" />
              </Form.Control>
            </Form.Item>
          </Cell.Group>
          <View className="btn-wrapper">
            <Button color="primary" formType="submit">
              创建项目
            </Button>
          </View>
        </Form>
      </Popup>
      <CTabBar value={0} onChange={onChangeTabItem} />
    </View>
  );
}
