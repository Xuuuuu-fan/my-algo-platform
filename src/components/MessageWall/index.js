import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './styles.module.css';
import AV from 'leancloud-storage';

// ================= 配置区 =================
const APP_ID = "6XhmNIffmUgeQYvV41nEDN9v-MdYXbMMI";
const APP_KEY = "OFwmlGnmNpzTmSFgqBqYDvgw";
const SERVER_URL = "https://6xhmniff.api.lncldglobal.com";
const ADMIN_SECRET = "xualgo";

if (!AV.applicationId) {
  AV.init({ appId: APP_ID, appKey: APP_KEY, serverURL: SERVER_URL });
}

const COLORS = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fff'];

const MessageWall = () => {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [activeNote, setActiveNote] = useState(null);

  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[2]);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [myUserId, setMyUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // --- 画布视图状态 ---
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false); // 标记：是否正在拖拽背景
  const lastMousePos = useRef({ x: 0, y: 0 }); // 记录上一帧鼠标位置
  const isDraggingNote = useRef(false); // 标记：是否正在拖拽便利贴

  useEffect(() => {
    let uid = localStorage.getItem('algo_user_id');
    if (!uid) {
      uid = 'user_' + Date.now().toString(36);
      localStorage.setItem('algo_user_id', uid);
    }
    setMyUserId(uid);
    if (localStorage.getItem('algo_is_admin') === 'true') setIsAdmin(true);

    // 阻止浏览器默认缩放
    const preventDefaultZoom = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    window.addEventListener('wheel', preventDefaultZoom, { passive: false });

    // 全局松开鼠标：防止拖出屏幕外后状态卡死
    const handleGlobalUp = () => {
      isPanning.current = false;
    };
    window.addEventListener('pointerup', handleGlobalUp);

    fetchNotes();

    return () => {
      window.removeEventListener('wheel', preventDefaultZoom);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, []);

  useEffect(() => {
    if (searchTerm === ADMIN_SECRET) {
      setIsAdmin(true);
      localStorage.setItem('algo_is_admin', 'true');
      alert("已进入管理员模式！");
      setSearchTerm('');
    }
  }, [searchTerm]);

  const handleExitAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('algo_is_admin');
    alert("已退出管理员模式");
  };

  const fetchNotes = async () => {
    try {
      const query = new AV.Query('Message');
      query.descending('createdAt');
      query.limit(100);
      const results = await query.find();
      setNotes(results.map(parseNote));
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const parseNote = (obj) => ({
    id: obj.id,
    userId: obj.get('userId'),
    content: obj.get('content'),
    color: obj.get('color') || '#fef08a',
    x: obj.get('x') || 0,
    y: obj.get('y') || 0,
    likes: obj.get('likes') || 0,
    comments: obj.get('comments') || [],
    date: new Date(obj.createdAt).toLocaleDateString(),
  });

  // --- 画布交互逻辑 (核心) ---

  // 1. 鼠标按下：开始拖拽
  // 1. 鼠标按下：开始拖拽
  const handlePanStart = (e) => {
    // 移除之前的 e.target.dataset.type === 'viewport' 判断
    // 因为便利贴和工具栏我们都会加 stopPropagation
    // 所以只要事件能冒泡到这里，说明用户点的肯定是背景（无论是 viewport 还是 canvasWorld）
    isPanning.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  // 2. 鼠标移动：更新画布位置
  const handlePanMove = (e) => {
    if (!isPanning.current) return;

    // 计算位移量
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    // 更新视图位置
    setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));

    // 更新记录点
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  // 3. 滚轮缩放
  const handleWheel = (e) => {
    if (modalMode) return;
    const scaleSensitivity = 0.001;
    const delta = -e.deltaY * scaleSensitivity;
    const newScale = Math.min(Math.max(view.scale + delta, 0.2), 3.0);
    setView(v => ({ ...v, scale: newScale }));
  };

  // --- 业务逻辑 ---

  const handleCreate = async () => {
    if (!content.trim()) return;
    const Message = AV.Object.extend('Message');
    const msg = new Message();
    const acl = new AV.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(true);
    msg.setACL(acl);

    // 新帖子生成在屏幕中心
    // 算法：(屏幕中心点 - 画布偏移) / 缩放比例
    const centerX = (window.innerWidth / 2 - view.x) / view.scale;
    const centerY = (window.innerHeight / 2 - view.y) / view.scale;

    // 减去卡片宽高的一半，让其居中
    const finalX = centerX - 120 + (Math.random() - 0.5) * 60;
    const finalY = centerY - 100 + (Math.random() - 0.5) * 60;

    msg.set('userId', myUserId);
    msg.set('content', content);
    msg.set('color', selectedColor);
    msg.set('x', finalX);
    msg.set('y', finalY);
    msg.set('likes', 0);
    msg.set('comments', []);

    await msg.save();
    setNotes([parseNote(msg), ...notes]);
    closeModal();
  };

  const handleNoteClick = (e, note) => {
    if (isDraggingNote.current) {
      e.stopPropagation();
      return;
    }
    openDetail(note);
  };

  const onNoteDragEnd = (id, point) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, x: point.x, y: point.y } : n));
    setTimeout(() => { isDraggingNote.current = false; }, 100);
    const todo = AV.Object.createWithoutData('Message', id);
    todo.set('x', point.x);
    todo.set('y', point.y);
    todo.save();
  };

  const handleDelete = async (e, note) => {
    e.stopPropagation();
    if (!window.confirm("确定删除？")) return;
    setNotes(prev => prev.filter(n => n.id !== note.id));
    if (modalMode === 'detail') closeModal();
    const todo = AV.Object.createWithoutData('Message', note.id);
    await todo.destroy();
  };

  const handleLike = (e, note) => {
    e.stopPropagation();
    const updated = { ...note, likes: note.likes + 1 };
    setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
    if (activeNote?.id === note.id) setActiveNote(updated);
    const todo = AV.Object.createWithoutData('Message', note.id);
    todo.increment('likes', 1);
    todo.save();
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    const newComment = { uid: myUserId, content: replyContent, time: new Date().toLocaleString() };
    const updatedNote = { ...activeNote, comments: [...activeNote.comments, newComment] };
    setActiveNote(updatedNote);
    setNotes(prev => prev.map(n => n.id === activeNote.id ? updatedNote : n));
    const todo = AV.Object.createWithoutData('Message', activeNote.id);
    todo.add('comments', newComment);
    await todo.save();
    setReplyContent('');
  };

  const openDetail = (note) => { setActiveNote(note); setModalMode('detail'); };
  const closeModal = () => { setModalMode(null); setContent(''); setReplyContent(''); };

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div
      className={styles.viewport}
      data-type="viewport"
      onPointerDown={handlePanStart}
      onPointerMove={handlePanMove}
      onWheel={handleWheel}
      style={{
        // 背景网格随视图移动和缩放
        backgroundSize: `${30 * view.scale}px ${30 * view.scale}px`,
        backgroundPosition: `${view.x}px ${view.y}px`
      }}
    >
      <div className={styles.zoomIndicator}>{Math.round(view.scale * 100)}%</div>

      {/* 世界画布 */}
      <motion.div
        className={styles.canvasWorld}
        style={{
          x: view.x,
          y: view.y,
          scale: view.scale
        }}
      >
        <AnimatePresence>
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              drag
              dragMomentum={false}
              onPointerDown={(e) => e.stopPropagation()} // 防止触发背景拖拽
              onDragStart={() => isDraggingNote.current = true}
              onDragEnd={(e, info) => onNoteDragEnd(note.id, info.point)}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              whileHover={{ scale: 1.05, zIndex: 1000 }}
              whileDrag={{ scale: 1.1, zIndex: 1000, cursor: 'grabbing' }}
              className={styles.noteCard}
              // 这里的样式位置是相对于 canvasWorld 的 (绝对定位)
              style={{
                left: 0,
                top: 0,
                x: note.x,
                y: note.y,
                backgroundColor: note.color,
                zIndex: 1
              }}
              onClick={(e) => handleNoteClick(e, note)}
            >
              <div className={styles.noteHeader}>
                <span>{note.date}</span>
                {(isAdmin || note.userId === myUserId) && (
                  <span className={styles.deleteBtn} onClick={(e) => handleDelete(e, note)}>×</span>
                )}
              </div>
              <div className={styles.noteContent}>
                {note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content}
              </div>
              <div className={styles.noteFooter}>
                <div className={styles.actionBtn}>💬 {note.comments.length}</div>
                <div className={styles.actionBtn} onClick={(e) => handleLike(e, note)}>❤️ {note.likes}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* UI 层 */}
      {/* 工具栏 - 添加 onPointerDown 阻止冒泡 */}
      <div
        className={styles.toolbar}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isAdmin ? (
          <div className={styles.adminBadge}>
            👑 管理员
            <span className={styles.exitIcon} onClick={handleExitAdmin} title="退出管理员模式">✕</span>
          </div>
        ) : null}

        <input
          className={styles.searchBar}
          placeholder={isAdmin ? "搜索..." : "🔍 搜索..."}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
        <button className={styles.addBtn} onClick={() => setModalMode('create')}>+</button>
      </div>

      {/* 弹窗 (保持不变) */}
      <AnimatePresence>
        {modalMode && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <motion.div className={styles.modal} onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
              {modalMode === 'create' ? (
                <>
                  <h3>🎨 新便利贴</h3>
                  <div className={styles.colorPicker}>{COLORS.map(c => <div key={c} className={`${styles.colorCircle} ${selectedColor === c ? styles.colorSelected : ''}`} style={{ backgroundColor: c }} onClick={() => setSelectedColor(c)} />)}</div>
                  <textarea className={styles.textarea} placeholder="写点什么..." value={content} onChange={e => setContent(e.target.value)} />
                  <div style={{ textAlign: 'right' }}><button className={styles.btnCancel} onClick={closeModal}>取消</button><button className={styles.btnPrimary} onClick={handleCreate}>发布</button></div>
                </>
              ) : (
                activeNote && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><h3 style={{ margin: 0 }}>详情</h3>{(isAdmin || activeNote.userId === myUserId) && <button style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer' }} onClick={(e) => handleDelete(e, activeNote)}>删除</button>}</div>
                    <div style={{ padding: 15, background: activeNote.color, borderRadius: 8, marginBottom: 20, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{activeNote.content}</div>
                    <h4>评论 ({activeNote.comments.length})</h4>
                    <div className={styles.commentList}>{activeNote.comments.length === 0 && <div style={{color:'#999', fontSize:12}}>暂无评论</div>}{activeNote.comments.map((c, i) => <div key={i} className={styles.commentItem}><div className={styles.commentMeta}>{c.uid === myUserId ? '我' : `用户${c.uid.substr(-4)}`} · {c.time}</div><div>{c.content}</div></div>)}</div>
                    <div style={{ display: 'flex', gap: 10 }}><input style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }} placeholder="回复..." value={replyContent} onChange={e => setReplyContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} /><button className={styles.btnPrimary} onClick={handleReply}>发送</button></div>
                  </>
                )
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageWall;