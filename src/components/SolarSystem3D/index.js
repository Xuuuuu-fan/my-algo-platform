import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { useHistory } from '@docusaurus/router';
import * as THREE from 'three';

// --- 1. 数据配置 ---
const PLANETS = [
  // 基础 (内圈)
  {
    id: 'array', title: '数组', path: '/docs/demo',
    type: 'rocky', color: '#00f2ff', radius: 14, speed: 0.6, size: 1.8,
    keywords: 'array vector 连续内存 随机访问 list' // 新增关键词
  },
  {
    id: 'linkedlist', title: '链表', path: '/docs/list/intro',
    type: 'rocky', color: '#00c3ff', radius: 19, speed: 0.5, size: 2.0,
    keywords: 'linked list 指针 node 节点'
  },

  // --- 核心 ---
  {
    id: 'stack', title: '栈', path: '/docs/stack/intro',
    type: 'gas', color: '#ff0055', radius: 26, speed: 0.4, size: 2.8,
    keywords: 'stack lifo 后进先出 push pop'
  },
  {
    id: 'queue', title: '队列', path: '/docs/queue/intro',
    type: 'gas', color: '#ff9900', radius: 34, speed: 0.35, size: 3.0,
    keywords: 'queue fifo 先进先出 bfs'
  },{ id: 'hash', title: '哈希表', path: '/docs/hash/intro', type: 'gas', color: '#b000b5', radius: 42, speed: 0.3, size: 3.2 },

  // 复杂结构 (外圈)
  {
    id: 'tree', title: '树/二叉树', path: '/docs/tree/intro',
    type: 'earth', color: '#00ff66', radius: 52, speed: 0.25, size: 3.5,
    keywords: 'tree binary root dfs bfs 遍历'
  },
  { id: 'graph', title: '图论', path: '/docs/graph/intro', type: 'gas', color: '#bd00ff', radius: 64, speed: 0.2, size: 4.0 },

  // 核心算法 (边缘圈)
  { id: 'search', title: '查找', path: '/docs/search/intro', type: 'ring', color: '#ffe600', radius: 78, speed: 0.15, size: 3.2 },
  { id: 'sort', title: '排序', path: '/docs/sort/intro', type: 'gas', color: '#ff3366', radius: 90, speed: 0.12, size: 3.8 },
  { id: 'greedy', title: '贪心', path: '/docs/greedy/intro', type: 'rocky', color: '#ffd700', radius: 102, speed: 0.1, size: 3.0 },
  { id: 'backtrack', title: '回溯', path: '/docs/backtrack/intro', type: 'ring', color: '#ff4d4d', radius: 115, speed: 0.08, size: 3.6 },
  {
    id: 'string', title: '字符串', path: '/docs/string/intro',
    type: 'ring', color: '#ffffff', radius: 130, speed: 0.06, size: 3.5,
    keywords: 'string kmp 匹配 模式串'
  },
];

// --- 2. 原生粒子爆炸 ---
const NativeExplosion = ({ color, onComplete }) => {
  const count = 400;
  const pointsRef = useRef();

  const [data] = useState(() => {
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random() - 0.5) * 5;
      positions[i*3+1] = (Math.random() - 0.5) * 5;
      positions[i*3+2] = (Math.random() - 0.5) * 5;
      velocities.push({
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5,
        z: (Math.random() - 0.5) * 1.5
      });
    }
    return { positions, velocities };
  });

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      posAttr.array[i*3] += data.velocities[i].x;
      posAttr.array[i*3+1] += data.velocities[i].y;
      posAttr.array[i*3+2] += data.velocities[i].z;
    }
    posAttr.needsUpdate = true;
    pointsRef.current.material.opacity -= 0.025;
    if (pointsRef.current.material.opacity <= 0) onComplete && onComplete();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attachObject={['attributes', 'position']} count={count} array={data.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={1.2} color={color} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

// --- 3. 行星外观组件 ---
const RockyVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} flatShading={true} />
    </mesh>
    <mesh scale={[1.05, 1.05, 1.05]}>
      <icosahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
    </mesh>
  </group>
);

const GasVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <sphereGeometry args={[size * 0.8, 32, 32]} />
      <meshBasicMaterial color={color} />
    </mesh>
    <Sphere args={[size, 32, 32]}>
      <MeshDistortMaterial
        color={color} speed={2} distort={0.2} radius={1}
        transparent opacity={0.6} roughness={0} metalness={0.5}
      />
    </Sphere>
    <mesh scale={[1.4, 1.4, 1.4]}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  </group>
);

const RingVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
      <ringGeometry args={[size * 1.4, size * 2.0, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
      <ringGeometry args={[size * 2.1, size * 2.15, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

const EarthVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <icosahedronGeometry args={[size, 4]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.8} />
    </mesh>
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
    </mesh>
  </group>
);

// --- 4. 行星逻辑 ---
const Planet = ({ data, history }) => {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHover] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  useFrame((state, delta) => {
    if (isExploding || !groupRef.current) return;
    if (!hovered) angleRef.current += delta * data.speed * 0.2;
    const x = Math.cos(angleRef.current) * data.radius;
    const z = Math.sin(angleRef.current) * data.radius;
    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z = 0.2;

    const targetScale = hovered ? 1.3 : 1.0;
    const cur = groupRef.current.scale.x;
    const next = THREE.MathUtils.lerp(cur, targetScale, 0.1);
    groupRef.current.scale.set(next, next, next);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    setIsExploding(true);
    document.body.style.cursor = 'auto';
  };

  const renderVisuals = () => {
    switch(data.type) {
      case 'rocky': return <RockyVisuals color={data.color} size={data.size} />;
      case 'gas': return <GasVisuals color={data.color} size={data.size} />;
      case 'ring': return <RingVisuals color={data.color} size={data.size} />;
      case 'earth': return <EarthVisuals color={data.color} size={data.size} />;
      default: return <RockyVisuals color={data.color} size={data.size} />;
    }
  };

  return (
    <group>
      {!isExploding ? (
        <group ref={groupRef}>
          <group
            onClick={handleClick}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
          >
            {renderVisuals()}
            <Html distanceFactor={80} position={[0, data.size + 2, 0]} center style={{ pointerEvents: 'none' }}>
              <div style={{
                color: hovered ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: 'bold', fontSize: '14px',
                textShadow: `0 0 10px ${data.color}`,
                whiteSpace: 'nowrap', opacity: hovered ? 1 : 0.6,
                background: hovered ? 'rgba(0,0,0,0.6)' : 'transparent',
                padding: '2px 8px', borderRadius: '4px',
                transition: 'all 0.2s', letterSpacing: '1px', borderBottom: hovered ? `2px solid ${data.color}` : 'none'
              }}>
                {data.title}
              </div>
            </Html>
          </group>
        </group>
      ) : (
        <group position={groupRef.current?.position}>
          <NativeExplosion color={data.color} onComplete={() => history.push(data.path)} />
        </group>
      )}
      {!isExploding && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[data.radius - 0.1, data.radius + 0.1, 128]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
};

// --- 5. 核心太阳 (纯净全息版 - 不遮挡) ---
const DataCoreSun = () => {
  const groupRef = useRef();
  const textRef = useRef();
  const [displayText, setDisplayText] = useState('');
  const fullText = "XU'S SPACE";

  // 打字机效果
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(fullText.substring(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(timer);
    }, 200);
    return () => clearInterval(timer);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // 呼吸幅度减小，更细腻
    const scale = 1 + Math.sin(t * 1.5) * 0.03;

    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
      groupRef.current.scale.set(scale, scale, scale);
    }
    if (textRef.current) {
      textRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
  });

  return (
    <group>
      {/* 太阳本体：稍微调暗一点点，让文字更凸显 */}
      <Sphere args={[6, 32, 32]}>
        <MeshDistortMaterial color="#ff6600" emissive="#aa3300" emissiveIntensity={2} speed={2} distort={0.25} />
      </Sphere>

      {/* 装饰光环 */}
      <group ref={groupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[8, 8.1, 64]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[11, 11.05, 64]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <pointLight distance={100} intensity={3} color="#ffaa00" />

      {/*
         HTML 层优化：
         1. 移除 center 属性，手动控制定位，防止偏移。
         2. pointerEvents: 'none' 确保鼠标能穿透文字点击后面的物体。
      */}
      <Html position={[0, 0, 0]} style={{ pointerEvents: 'none', width: '100%', height: '100%' }} zIndexRange={[100, 0]}>
        <style>{`
          .holo-container {
            /* 绝对定位居中 */
            position: absolute;
            top: 50%;
            left: 50%;
            /* 这里的 transform 由 JS 动态控制覆盖，初始写一下 */
            transform: translate(-50%, -50%);
            
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            
            /* 关键：去掉背景色和边框，只留文字 */
            background: transparent;
            padding: 0;
            width: max-content;
          }

          .holo-title {
            font-family: 'Inter', system-ui, sans-serif;
            font-weight: 900;
            /* 字体大小调整：缩小到适合放入太阳内部 */
            font-size: clamp(20px, 4vw, 40px);
            line-height: 1;
            
            /* 文字颜色：纯白核心 + 强发光 */
            color: #ffffff;
            text-align: center;
            white-space: nowrap;
            
            /* 关键：强烈的文字阴影，保证在亮背景下也清晰可见 */
            text-shadow: 
              0 0 5px rgba(0,0,0, 0.8),
              0 0 10px rgba(0, 242, 255, 0.8),
              0 0 20px rgba(0, 242, 255, 0.5);
              
            letter-spacing: 2px;
          }

          .holo-sub {
            margin-top: 5px;
            font-family: 'Courier New', monospace;
            font-size: clamp(8px, 1.2vw, 12px);
            color: rgba(255, 255, 255, 0.9);
            font-weight: bold;
            letter-spacing: 4px;
            text-transform: uppercase;
            
            /* 副标题加黑色描边 */
            text-shadow: 0 0 3px #000000;
          }
          
          .cursor {
            color: #00f2ff;
            animation: blink 1s step-end infinite;
            text-shadow: 0 0 5px #00f2ff;
          }
          
          @keyframes blink { 50% { opacity: 0; } }
        `}</style>

        {/*
           注意：这里去掉了外层的 className="hud-container"，
           直接用纯净的 holo-container，没有背景板
        */}
        <div ref={textRef} className="holo-container">
          <div className="holo-title">
            {displayText}
            <span className="cursor">_</span>
          </div>

          <div className="holo-sub">
            DATA STRUCTURE
          </div>
        </div>
      </Html>
    </group>
  );
};
// --- 6. 背景装饰 ---
const Nebula = () => {
  const data = useMemo(() => new Array(5).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 50, z: (Math.random() - 0.5) * 200,
      scale: 20 + Math.random() * 20, color: Math.random() > 0.5 ? '#2f54eb' : '#bd00ff'
    })), []);
  return (
    <group>
      {data.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[d.scale, 16, 16]} />
          <meshBasicMaterial color={d.color} transparent opacity={0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

// src/pages/index.js

// ... 保持前面的 import 不变 ...

// 1. 新增：一个辅助函数，在内存里画一个发光的圆
// 这样就不需要从 GitHub 下载图片了，彻底解决方块和加载失败的问题
const useCircleTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // 画一个渐变的圆，中心亮，边缘透明，模拟发光效果
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // 中心纯白
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // 边缘透明

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);
};

// 2. 修改：星空组件
const NativeStarField = () => {
  const count = 2000; // 增加数量
  const groupRef = useRef();
  const texture = useCircleTexture(); // 获取刚才画的圆形贴图

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count); // 每个星星大小不一样

    for(let i=0; i<count; i++) {
      // 范围广度优化：既有远处的背景，也有近处的尘埃
      const r = 100 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);

      // 随机大小：0.5 ~ 2.0
      sz[i] = 0.5 + Math.random() * 1.5;
    }
    return [pos, sz];
  }, []);

  // 让星空缓慢旋转，增加沉浸感
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02; // 慢速自转
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attachObject={['attributes', 'position']} count={count} array={positions} itemSize={3} />
          {/* 注入随机大小属性 */}
          <bufferAttribute attachObject={['attributes', 'size']} count={count} array={sizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial
          size={1} // 基础大小
          map={texture} // 重点：应用圆形贴图
          transparent
          opacity={0.8}
          alphaTest={0.01} // 去除完全透明的边缘
          depthWrite={false} // 防止遮挡
          blending={THREE.AdditiveBlending} // 发光叠加模式
          sizeAttenuation // 开启近大远小
          vertexColors={false}
          color="#ffffff"
        />
      </points>
    </group>
  );
};

// ... 后面的 Nebula, SolarSystem3D 等保持不变 ...
// --- 7. 主场景 + 搜索逻辑 ---
const SolarSystem3D = () => {
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤逻辑: 根据标题或ID模糊查找
  const filteredPlanets = useMemo(() => {
  if (!searchQuery) return PLANETS;
  const lowerQuery = searchQuery.toLowerCase();

  return PLANETS.filter(p =>
    p.title.toLowerCase().includes(lowerQuery) ||
    p.id.toLowerCase().includes(lowerQuery) ||
    // 新增：匹配关键词
    (p.keywords && p.keywords.toLowerCase().includes(lowerQuery))
  );
}, [searchQuery]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#020204', position: 'relative' }}>

      {/* --- 搜索框 Overlay --- */}
      <div style={{
        position: 'absolute', top: '20px', right: '20px', zIndex: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(0, 20, 40, 0.8)', border: '1px solid #00f2ff', borderRadius: '4px',
          padding: '8px 12px', boxShadow: '0 0 15px rgba(0, 242, 255, 0.2)', backdropFilter: 'blur(4px)'
        }}>
          <span style={{ color: '#00f2ff', marginRight: '10px', fontSize: '18px' }}>🔍</span>
          <input
            type="text"
            placeholder="SEARCH SYSTEM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent', border: 'none', color: '#fff', outline: 'none',
              fontFamily: "'Courier New', Courier, monospace", fontSize: '16px', width: '200px',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}
          />
        </div>
        {searchQuery && (
          <div style={{ color: 'rgba(0, 242, 255, 0.7)', fontSize: '12px', fontFamily: "'Courier New', monospace" }}>
            FOUND: {filteredPlanets.length} NODES
          </div>
        )}
      </div>

      <Canvas camera={{ position: [0, 60, 90], fov: 55 }}>
        <ambientLight intensity={0.2} />
        <NativeStarField />
        <Nebula />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]}>
          <planeGeometry args={[600, 600, 60, 60]} />
          <meshBasicMaterial color="#1a2b3c" wireframe transparent opacity={0.06} />
        </mesh>

        <DataCoreSun />

        {/* 渲染过滤后的星球 */}
        {filteredPlanets.map((planet) => (
          <Planet key={planet.id} data={planet} history={history} />
        ))}

        <OrbitControls enablePan={false} enableZoom={true} maxDistance={250} minDistance={30} autoRotate={!searchQuery} autoRotateSpeed={0.15} maxPolarAngle={Math.PI / 2} />
      </Canvas>

      <div style={{
        position: 'absolute', bottom: '50px', width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 10
      }}>
         <div style={{
           display: 'inline-block', color: '#00f3ff', fontFamily: '"Courier New", Courier, monospace',
           fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', border: '1px solid #00f3ff',
           padding: '12px 30px', borderRadius: '4px', background: 'rgba(0, 0, 0, 0.7)',
           boxShadow: '0 0 15px rgba(0, 243, 255, 0.4), inset 0 0 10px rgba(0, 243, 255, 0.2)', textTransform: 'uppercase'
         }}>
            拖拽探索 · 点击进入 · 搜索定位
         </div>
      </div>
    </div>
  );
};

export default SolarSystem3D;