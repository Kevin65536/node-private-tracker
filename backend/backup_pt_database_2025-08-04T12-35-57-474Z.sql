--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_announce_logs_event; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_announce_logs_event AS ENUM (
    'started',
    'stopped',
    'completed',
    'update'
);


ALTER TYPE public.enum_announce_logs_event OWNER TO postgres;

--
-- Name: enum_downloads_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_downloads_status AS ENUM (
    'downloading',
    'seeding',
    'stopped',
    'completed'
);


ALTER TYPE public.enum_downloads_status OWNER TO postgres;

--
-- Name: enum_peers_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_peers_status AS ENUM (
    'started',
    'downloading',
    'seeding',
    'stopped',
    'completed'
);


ALTER TYPE public.enum_peers_status OWNER TO postgres;

--
-- Name: enum_torrents_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_torrents_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_torrents_status OWNER TO postgres;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_role AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public.enum_users_role OWNER TO postgres;

--
-- Name: enum_users_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_status AS ENUM (
    'active',
    'inactive',
    'banned'
);


ALTER TYPE public.enum_users_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announce_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announce_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    torrent_id integer NOT NULL,
    info_hash character varying(40) NOT NULL,
    peer_id character varying(20) NOT NULL,
    ip inet NOT NULL,
    port integer NOT NULL,
    uploaded bigint DEFAULT 0,
    downloaded bigint DEFAULT 0,
    "left" bigint DEFAULT 0,
    event public.enum_announce_logs_event,
    user_agent character varying(255),
    response_time integer,
    announced_at timestamp with time zone
);


ALTER TABLE public.announce_logs OWNER TO postgres;

--
-- Name: announce_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announce_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announce_logs_id_seq OWNER TO postgres;

--
-- Name: announce_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announce_logs_id_seq OWNED BY public.announce_logs.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(255),
    sort_order integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: downloads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.downloads (
    id integer NOT NULL,
    user_id integer NOT NULL,
    torrent_id integer NOT NULL,
    uploaded bigint DEFAULT 0,
    downloaded bigint DEFAULT 0,
    "left" bigint DEFAULT 0,
    status public.enum_downloads_status DEFAULT 'downloading'::public.enum_downloads_status,
    last_announce timestamp with time zone,
    peer_id character varying(20),
    ip character varying(45),
    port integer,
    user_agent character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.downloads OWNER TO postgres;

--
-- Name: downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.downloads_id_seq OWNER TO postgres;

--
-- Name: downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.downloads_id_seq OWNED BY public.downloads.id;


--
-- Name: info_hash_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.info_hash_variants (
    id integer NOT NULL,
    original_torrent_id integer NOT NULL,
    variant_info_hash character varying(40) NOT NULL,
    user_passkey character varying(32),
    announce_url text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.info_hash_variants OWNER TO postgres;

--
-- Name: info_hash_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.info_hash_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.info_hash_variants_id_seq OWNER TO postgres;

--
-- Name: info_hash_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.info_hash_variants_id_seq OWNED BY public.info_hash_variants.id;


--
-- Name: peers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    torrent_id integer NOT NULL,
    info_hash character varying(40) NOT NULL,
    peer_id character varying(20) NOT NULL,
    ip inet NOT NULL,
    port integer NOT NULL,
    uploaded bigint DEFAULT 0,
    downloaded bigint DEFAULT 0,
    "left" bigint DEFAULT 0,
    status public.enum_peers_status DEFAULT 'started'::public.enum_peers_status,
    user_agent character varying(255),
    key character varying(8),
    last_announce timestamp with time zone,
    first_announce timestamp with time zone,
    announces integer DEFAULT 1,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.peers OWNER TO postgres;

--
-- Name: peers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peers_id_seq OWNER TO postgres;

--
-- Name: peers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peers_id_seq OWNED BY public.peers.id;


--
-- Name: torrents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.torrents (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    info_hash character varying(40) NOT NULL,
    size bigint NOT NULL,
    file_count integer DEFAULT 1,
    uploader_id integer NOT NULL,
    category_id integer NOT NULL,
    status public.enum_torrents_status DEFAULT 'pending'::public.enum_torrents_status,
    seeders integer DEFAULT 0,
    leechers integer DEFAULT 0,
    completed integer DEFAULT 0,
    torrent_file character varying(255) NOT NULL,
    nfo_file character varying(255),
    image_files json,
    tags json,
    free_leech boolean DEFAULT false,
    double_upload boolean DEFAULT false,
    free_leech_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    review_reason text,
    reviewed_by integer,
    reviewed_at timestamp with time zone
);


ALTER TABLE public.torrents OWNER TO postgres;

--
-- Name: torrents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.torrents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.torrents_id_seq OWNER TO postgres;

--
-- Name: torrents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.torrents_id_seq OWNED BY public.torrents.id;


--
-- Name: user_passkeys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_passkeys (
    id integer NOT NULL,
    user_id integer NOT NULL,
    passkey character varying(32) NOT NULL,
    active boolean DEFAULT true,
    last_used timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_passkeys OWNER TO postgres;

--
-- Name: user_passkeys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_passkeys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_passkeys_id_seq OWNER TO postgres;

--
-- Name: user_passkeys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_passkeys_id_seq OWNED BY public.user_passkeys.id;


--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_stats (
    id integer NOT NULL,
    user_id integer NOT NULL,
    uploaded bigint DEFAULT 0,
    downloaded bigint DEFAULT 0,
    seedtime bigint DEFAULT 0,
    leechtime bigint DEFAULT 0,
    bonus_points numeric(10,2) DEFAULT 0,
    invitations integer DEFAULT 0,
    torrents_uploaded integer DEFAULT 0,
    torrents_seeding integer DEFAULT 0,
    torrents_leeching integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_stats OWNER TO postgres;

--
-- Name: user_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_stats_id_seq OWNER TO postgres;

--
-- Name: user_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_stats_id_seq OWNED BY public.user_stats.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.enum_users_role DEFAULT 'user'::public.enum_users_role,
    status public.enum_users_status DEFAULT 'active'::public.enum_users_status,
    avatar character varying(255),
    invitation_code character varying(32),
    invited_by integer,
    last_login timestamp with time zone,
    registration_ip character varying(45),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: announce_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announce_logs ALTER COLUMN id SET DEFAULT nextval('public.announce_logs_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: downloads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads ALTER COLUMN id SET DEFAULT nextval('public.downloads_id_seq'::regclass);


--
-- Name: info_hash_variants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants ALTER COLUMN id SET DEFAULT nextval('public.info_hash_variants_id_seq'::regclass);


--
-- Name: peers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peers ALTER COLUMN id SET DEFAULT nextval('public.peers_id_seq'::regclass);


--
-- Name: torrents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents ALTER COLUMN id SET DEFAULT nextval('public.torrents_id_seq'::regclass);


--
-- Name: user_passkeys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys ALTER COLUMN id SET DEFAULT nextval('public.user_passkeys_id_seq'::regclass);


--
-- Name: user_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats ALTER COLUMN id SET DEFAULT nextval('public.user_stats_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: announce_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announce_logs (id, user_id, torrent_id, info_hash, peer_id, ip, port, uploaded, downloaded, "left", event, user_agent, response_time, announced_at) FROM stdin;
82	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-kNo3f~j0jyIz	172.21.77.185	27052	0	0	5199876277	started	qBittorrent/5.1.2	324	2025-08-03 22:22:25.783+08
84	16	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-nPadoVR5VdA.	172.23.69.233	13761	0	0	5199876277	started	qBittorrent/5.1.2	252	2025-08-03 22:31:55.832+08
87	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	0	9720697117	started	qBittorrent/5.1.2	209	2025-08-03 22:33:41.256+08
90	16	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-nPadoVR5VdA.	172.23.69.233	13761	0	0	5199876277	started	qBittorrent/5.1.2	200	2025-08-03 22:34:25.078+08
92	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	0	5199876277	started	qBittorrent Enhanced/5.0.2.10	118	2025-08-03 22:37:49.917+08
94	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-kNo3f~j0jyIz	172.21.77.185	27052	0	5199876277	0	completed	qBittorrent/5.1.2	83	2025-08-03 22:39:01.484+08
100	18	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB502A--orjn9q!(6O!	172.23.90.2	42147	0	0	37116375178	stopped	qBittorrent Enhanced/5.0.2.10	179	2025-08-03 22:41:04.18+08
102	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	0	9720697117	started	qBittorrent/5.1.2	365	2025-08-03 22:47:53.459+08
104	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	5199876277	0	0	update	qBittorrent/4.6.5	181	2025-08-03 22:52:04.345+08
106	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-gpWAa2wVlSW*	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	186	2025-08-03 22:55:48.381+08
108	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-s9v1AoqZxr9B	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	174	2025-08-03 23:01:04.471+08
110	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-oS.-Q0~36czL	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	173	2025-08-03 23:08:02.338+08
112	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	3819421696	1343213749	update	qBittorrent Enhanced/5.0.2.10	195	2025-08-03 23:09:31.679+08
113	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	9720697117	0	completed	qBittorrent/5.1.2	30	2025-08-03 23:09:37.668+08
115	1	28	cb60ff4e84713c23732d8ab4e549ebde4f5029db	-qB4650-wjBi*ZTy1aX)	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	384	2025-08-03 23:12:45.804+08
117	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	19148057665	0	0	update	qBittorrent/4.6.5	218	2025-08-03 23:19:23.5+08
119	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	5199876277	0	0	update	qBittorrent/4.6.5	188	2025-08-03 23:22:04.386+08
121	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-gpWAa2wVlSW*	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	206	2025-08-03 23:25:48.384+08
123	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-s9v1AoqZxr9B	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	397	2025-08-03 23:31:04.594+08
125	1	26	e235f005479fb4711e8390e95ec621e8b0b4c029	-qB4650-LWitLhaz9!aM	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	184	2025-08-03 23:33:31.388+08
129	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	0	1331815691	started	qBittorrent/5.1.2	213	2025-08-03 23:38:33.881+08
131	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	9720697117	0	update	qBittorrent/5.1.2	188	2025-08-03 23:39:37.2+08
133	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-xbKLe*iz3Ydi	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	182	2025-08-03 23:41:43.368+08
135	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	0	1331815691	stopped	qBittorrent/5.1.2	186	2025-08-03 23:43:02.179+08
136	15	24	3724892068a31bfa312744a985f2a9df8068455a	-qB5120-gRk5wVtgjlo*	172.21.77.185	27052	0	0	8152837144	stopped	qBittorrent/5.1.2	52	2025-08-03 23:43:03.776+08
137	15	24	3724892068a31bfa312744a985f2a9df8068455a	-qB5120-gRk5wVtgjlo*	172.21.77.185	27052	0	0	8152837144	started	qBittorrent/5.1.2	57	2025-08-03 23:43:05.256+08
138	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	0	1331815691	started	qBittorrent/5.1.2	24	2025-08-03 23:43:06.896+08
140	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-tWGL2W0e.S*A	172.21.77.185	27052	0	0	5199876277	started	qBittorrent/5.1.2	189	2025-08-03 23:44:41.043+08
143	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	2634191133	0	update	qBittorrent/5.1.2	286	2025-08-04 00:11:23.935+08
146	1	26	e235f005479fb4711e8390e95ec621e8b0b4c029	-qB4650-LWitLhaz9!aM	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	184	2025-08-04 00:12:05.399+08
148	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-tWGL2W0e.S*A	172.21.77.185	27052	0	0	5199876277	stopped	qBittorrent/5.1.2	189	2025-08-04 00:12:32.132+08
149	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-tWGL2W0e.S*A	172.21.77.185	27052	0	0	5199876277	started	qBittorrent/5.1.2	49	2025-08-04 00:12:32.905+08
150	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	0	1331815691	stopped	qBittorrent/5.1.2	55	2025-08-04 00:12:34.434+08
151	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-tWGL2W0e.S*A	172.21.77.185	27052	0	0	5199876277	stopped	qBittorrent/5.1.2	37	2025-08-04 00:12:38.315+08
152	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-eINg4wdG9qw-	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	40	2025-08-04 00:12:39.065+08
153	15	24	3724892068a31bfa312744a985f2a9df8068455a	-qB5120-gRk5wVtgjlo*	172.21.77.185	27052	0	0	8152837144	stopped	qBittorrent/5.1.2	47	2025-08-04 00:12:39.658+08
154	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	87	2025-08-04 00:12:41.123+08
155	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-oS.-Q0~36czL	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	87	2025-08-04 00:12:41.125+08
156	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-tWGL2W0e.S*A	172.21.77.185	27052	0	0	5199876277	started	qBittorrent/5.1.2	54	2025-08-04 00:12:41.188+08
160	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	1228767232	103408907	stopped	qBittorrent/5.1.2	190	2025-08-04 00:14:49.124+08
161	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	0	103408907	started	qBittorrent/5.1.2	46	2025-08-04 00:14:53.31+08
164	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-s9v1AoqZxr9B	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	41	2025-08-04 00:15:25.068+08
165	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	103048459	0	completed	qBittorrent/5.1.2	195	2025-08-04 00:15:59.109+08
166	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	5162553525	0	update	qBittorrent Enhanced/5.0.2.10	186	2025-08-04 00:16:19.817+08
167	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-gpWAa2wVlSW*	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	192	2025-08-04 00:18:14.421+08
83	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-s9v1AoqZxr9B	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	216	2025-08-03 22:31:04.397+08
85	16	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-nPadoVR5VdA.	172.23.69.233	13761	0	0	5199876277	stopped	qBittorrent/5.1.2	529	2025-08-03 22:32:54.075+08
86	16	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-nPadoVR5VdA.	172.23.69.233	13761	0	0	5199876277	started	qBittorrent/5.1.2	55	2025-08-03 22:33:02.095+08
88	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	7086505984	2634420509	stopped	qBittorrent/5.1.2	236	2025-08-03 22:33:58.312+08
89	16	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-nPadoVR5VdA.	172.23.69.233	13761	0	0	5199876277	stopped	qBittorrent/5.1.2	66	2025-08-03 22:34:01.056+08
91	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	0	9720697117	stopped	qBittorrent/5.1.2	95	2025-08-03 22:35:06.88+08
93	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-oS.-Q0~36czL	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	211	2025-08-03 22:38:02.408+08
95	18	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB502A--orjn9q!(6O!	172.23.90.2	42147	0	0	37116375178	started	qBittorrent Enhanced/5.0.2.10	208	2025-08-03 22:39:23.472+08
96	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	37322752	5163176117	stopped	qBittorrent Enhanced/5.0.2.10	85	2025-08-03 22:39:25.5+08
97	18	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB502A--orjn9q!(6O!	172.23.90.2	42147	0	0	37116375178	stopped	qBittorrent Enhanced/5.0.2.10	75	2025-08-03 22:39:28.492+08
98	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	0	5163176117	started	qBittorrent Enhanced/5.0.2.10	58	2025-08-03 22:39:31.62+08
99	18	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB502A--orjn9q!(6O!	172.23.90.2	42147	0	0	37116375178	started	qBittorrent Enhanced/5.0.2.10	83	2025-08-03 22:39:32.259+08
101	16	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-nPadoVR5VdA.	172.23.69.233	13761	0	0	5199876277	stopped	qBittorrent/5.1.2	466	2025-08-03 22:47:53.356+08
103	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	7086570739	0	0	update	qBittorrent/4.6.5	181	2025-08-03 22:49:23.466+08
105	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-I0BBbPZnluK1	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	238	2025-08-03 22:52:51.421+08
107	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-eINg4wdG9qw-	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	198	2025-08-03 22:58:18.511+08
109	1	26	e235f005479fb4711e8390e95ec621e8b0b4c029	-qB4650-LWitLhaz9!aM	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	198	2025-08-03 23:03:31.358+08
111	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-kNo3f~j0jyIz	172.21.77.185	27052	3859599984	5199876277	0	update	qBittorrent/5.1.2	35	2025-08-03 23:09:00.591+08
114	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-xbKLe*iz3Ydi	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	51	2025-08-03 23:11:43.043+08
116	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	0	2634420509	started	qBittorrent/5.1.2	182	2025-08-03 23:15:22.683+08
118	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	2634191133	0	completed	qBittorrent/5.1.2	184	2025-08-03 23:19:52.974+08
120	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-I0BBbPZnluK1	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	179	2025-08-03 23:22:51.485+08
122	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-eINg4wdG9qw-	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	138	2025-08-03 23:28:18.14+08
124	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	5162553525	0	completed	qBittorrent Enhanced/5.0.2.10	192	2025-08-03 23:31:58.814+08
126	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	19441458989	0	0	stopped	qBittorrent/4.6.5	206	2025-08-03 23:37:59.789+08
127	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-oS.-Q0~36czL	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	29	2025-08-03 23:38:02.039+08
128	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	60	2025-08-03 23:38:02.635+08
130	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-kNo3f~j0jyIz	172.21.77.185	27052	5205172357	5199876277	0	update	qBittorrent/5.1.2	192	2025-08-03 23:39:00.958+08
132	15	24	3724892068a31bfa312744a985f2a9df8068455a	-qB5120-gRk5wVtgjlo*	172.21.77.185	27052	0	0	8152837144	started	qBittorrent/5.1.2	49	2025-08-03 23:40:07.546+08
78	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	0	9720697117	started	qBittorrent/5.1.2	48	2025-08-03 22:19:01.759+08
79	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	188	2025-08-03 22:19:23.335+08
80	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	116	2025-08-03 22:22:04.1+08
81	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-5fL64bmCKN)J	172.21.77.185	27052	0	0	5199876277	stopped	qBittorrent/5.1.2	64	2025-08-03 22:22:05.649+08
134	1	28	cb60ff4e84713c23732d8ab4e549ebde4f5029db	-qB4650-wjBi*ZTy1aX)	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	205	2025-08-03 23:42:45.552+08
139	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-kNo3f~j0jyIz	172.21.77.185	27052	5205172357	5199876277	0	stopped	qBittorrent/5.1.2	186	2025-08-03 23:43:59.694+08
141	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	5199876277	0	0	stopped	qBittorrent/4.6.5	184	2025-08-03 23:45:12.669+08
142	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	27	2025-08-03 23:45:13.53+08
144	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-xbKLe*iz3Ydi	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	188	2025-08-04 00:11:43.389+08
145	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	9720697117	0	update	qBittorrent/5.1.2	29	2025-08-04 00:11:48.964+08
147	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	2634191133	0	update	qBittorrent/5.1.2	177	2025-08-04 00:12:18.929+08
157	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	0	1331815691	started	qBittorrent/5.1.2	219	2025-08-04 00:12:42.92+08
158	15	24	3724892068a31bfa312744a985f2a9df8068455a	-qB5120-gRk5wVtgjlo*	172.21.77.185	27052	0	0	8152837144	started	qBittorrent/5.1.2	26	2025-08-04 00:12:44.023+08
159	1	28	cb60ff4e84713c23732d8ab4e549ebde4f5029db	-qB4650-wjBi*ZTy1aX)	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	56	2025-08-04 00:12:45.089+08
162	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	184	2025-08-04 00:15:13.372+08
163	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-I0BBbPZnluK1	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	54	2025-08-04 00:15:17.098+08
168	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-eINg4wdG9qw-	172.21.48.71	27633	1331890822	0	0	stopped	qBittorrent/4.6.5	356	2025-08-04 00:26:11.008+08
169	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	454	2025-08-04 00:26:11.111+08
170	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-s9v1AoqZxr9B	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	23	2025-08-04 00:26:11.157+08
171	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-oS.-Q0~36czL	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	43	2025-08-04 00:26:11.232+08
172	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-gpWAa2wVlSW*	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	97	2025-08-04 00:26:11.343+08
173	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-I0BBbPZnluK1	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	168	2025-08-04 00:26:11.408+08
174	1	26	e235f005479fb4711e8390e95ec621e8b0b4c029	-qB4650-LWitLhaz9!aM	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	124	2025-08-04 00:26:11.412+08
176	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	364	2025-08-04 00:26:11.466+08
175	1	28	cb60ff4e84713c23732d8ab4e549ebde4f5029db	-qB4650-wjBi*ZTy1aX)	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	170	2025-08-04 00:26:11.463+08
177	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-xbKLe*iz3Ydi	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	285	2025-08-04 00:26:11.576+08
178	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	9720697117	0	update	qBittorrent/5.1.2	215	2025-08-04 00:41:49.496+08
179	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	2634191133	0	update	qBittorrent/5.1.2	185	2025-08-04 00:42:18.949+08
180	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-tWGL2W0e.S*A	172.21.77.185	27052	0	0	5199876277	update	qBittorrent/5.1.2	217	2025-08-04 00:42:40.967+08
181	15	24	3724892068a31bfa312744a985f2a9df8068455a	-qB5120-gRk5wVtgjlo*	172.21.77.185	27052	0	0	8152837144	update	qBittorrent/5.1.2	49	2025-08-04 00:42:43.641+08
182	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	103048459	0	update	qBittorrent/5.1.2	191	2025-08-04 00:45:59.089+08
183	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	5162553525	0	update	qBittorrent Enhanced/5.0.2.10	190	2025-08-04 00:46:19.927+08
184	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	195	2025-08-04 10:20:02.199+08
185	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	188	2025-08-04 10:20:16.634+08
186	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	193	2025-08-04 10:20:32.211+08
187	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	188	2025-08-04 10:21:08.175+08
188	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	44	2025-08-04 10:21:14.855+08
189	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	35	2025-08-04 10:21:19.406+08
190	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	12125860456	started	qBittorrent/4.6.5	30	2025-08-04 10:21:25.266+08
191	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	10517344872	started	qBittorrent/4.6.5	47	2025-08-04 10:21:31.612+08
192	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	208	2025-08-04 10:22:14.158+08
193	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	195	2025-08-04 10:23:00.805+08
194	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	303	2025-08-04 10:23:38.59+08
195	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	191	2025-08-04 10:50:02.652+08
196	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	184	2025-08-04 10:50:16.679+08
197	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	192	2025-08-04 10:51:08.558+08
198	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	24	2025-08-04 10:51:14.204+08
199	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	25	2025-08-04 10:51:19.204+08
200	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	186	2025-08-04 10:52:14.666+08
201	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	188	2025-08-04 10:53:00.69+08
202	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	186	2025-08-04 10:53:38.545+08
203	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	183	2025-08-04 11:20:02.684+08
204	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	178	2025-08-04 11:20:16.557+08
205	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	182	2025-08-04 11:21:08.708+08
206	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	35	2025-08-04 11:21:14.244+08
207	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	36	2025-08-04 11:21:19.244+08
208	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	201	2025-08-04 11:22:14.709+08
209	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	180	2025-08-04 11:23:00.674+08
210	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	179	2025-08-04 11:23:38.56+08
211	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	202	2025-08-04 11:50:02.61+08
212	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	189	2025-08-04 11:50:16.593+08
213	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	197	2025-08-04 11:51:08.613+08
214	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	15	2025-08-04 11:51:14.246+08
215	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	16	2025-08-04 11:51:19.243+08
216	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	216	2025-08-04 11:52:14.722+08
217	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	196	2025-08-04 11:53:00.602+08
218	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	191	2025-08-04 11:53:38.7+08
219	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	208	2025-08-04 12:20:02.644+08
220	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	204	2025-08-04 12:20:16.722+08
221	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	235	2025-08-04 12:21:08.651+08
222	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	24	2025-08-04 12:21:14.286+08
223	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	21	2025-08-04 12:21:19.272+08
224	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	189	2025-08-04 12:22:14.621+08
225	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	196	2025-08-04 12:23:00.721+08
226	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	199	2025-08-04 12:23:38.63+08
227	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	176	2025-08-04 12:50:02.638+08
228	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	179	2025-08-04 12:50:16.763+08
229	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	183	2025-08-04 12:51:08.788+08
230	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	24	2025-08-04 12:51:14.316+08
231	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	39	2025-08-04 12:51:19.322+08
232	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	183	2025-08-04 12:52:14.766+08
233	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	185	2025-08-04 12:53:00.772+08
234	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	182	2025-08-04 12:53:38.656+08
235	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	179	2025-08-04 13:20:02.801+08
236	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	179	2025-08-04 13:20:16.774+08
237	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	178	2025-08-04 13:21:08.688+08
238	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	27	2025-08-04 13:21:14.345+08
239	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	26	2025-08-04 13:21:19.337+08
240	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	182	2025-08-04 13:22:14.676+08
241	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	184	2025-08-04 13:23:00.686+08
242	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	175	2025-08-04 13:23:38.773+08
243	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	178	2025-08-04 13:50:02.7+08
244	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	179	2025-08-04 13:50:16.675+08
245	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	181	2025-08-04 13:51:08.688+08
246	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	28	2025-08-04 13:51:14.36+08
247	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	30	2025-08-04 13:51:19.369+08
248	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	183	2025-08-04 13:52:14.813+08
249	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	177	2025-08-04 13:53:00.685+08
250	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	178	2025-08-04 13:53:38.828+08
251	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	295	2025-08-04 14:20:02.833+08
252	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	395	2025-08-04 14:20:02.936+08
253	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	318	2025-08-04 14:20:16.871+08
254	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	394	2025-08-04 14:20:16.95+08
255	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	333	2025-08-04 14:21:08.873+08
256	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	367	2025-08-04 14:21:08.909+08
257	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	33	2025-08-04 14:21:14.402+08
258	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	29	2025-08-04 14:21:14.414+08
259	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	30	2025-08-04 14:21:19.402+08
260	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	28	2025-08-04 14:21:19.403+08
261	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	302	2025-08-04 14:22:14.867+08
262	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	391	2025-08-04 14:22:14.957+08
263	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	308	2025-08-04 14:23:00.942+08
264	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	333	2025-08-04 14:23:00.969+08
265	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	314	2025-08-04 14:23:38.868+08
266	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	321	2025-08-04 14:23:38.878+08
267	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	316	2025-08-04 14:50:02.889+08
268	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	390	2025-08-04 14:50:02.967+08
269	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	263	2025-08-04 14:50:16.855+08
270	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	413	2025-08-04 14:50:17.007+08
271	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	304	2025-08-04 14:51:08.979+08
272	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	410	2025-08-04 14:51:09.086+08
273	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	51	2025-08-04 14:51:14.441+08
274	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	214	2025-08-04 14:51:14.607+08
275	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	61	2025-08-04 14:51:19.454+08
276	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	65	2025-08-04 14:51:19.455+08
277	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	336	2025-08-04 14:52:14.938+08
278	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	421	2025-08-04 14:52:15.025+08
279	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	304	2025-08-04 14:53:00.878+08
280	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	410	2025-08-04 14:53:00.986+08
281	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	336	2025-08-04 14:53:38.897+08
282	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	422	2025-08-04 14:53:38.986+08
283	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	315	2025-08-04 15:20:02.923+08
284	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	416	2025-08-04 15:20:03.026+08
285	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	302	2025-08-04 15:20:16.898+08
286	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	405	2025-08-04 15:20:17.002+08
287	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	314	2025-08-04 15:21:09.046+08
288	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	382	2025-08-04 15:21:09.116+08
289	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	48	2025-08-04 15:21:14.465+08
290	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	216	2025-08-04 15:21:14.635+08
291	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	60	2025-08-04 15:21:19.486+08
292	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	64	2025-08-04 15:21:19.488+08
293	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	291	2025-08-04 15:22:14.958+08
294	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	346	2025-08-04 15:22:15.015+08
295	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	296	2025-08-04 15:23:00.895+08
296	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	420	2025-08-04 15:23:01.021+08
297	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	372	2025-08-04 15:23:38.995+08
298	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	492	2025-08-04 15:23:39.117+08
299	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	302	2025-08-04 15:50:02.94+08
300	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	408	2025-08-04 15:50:03.048+08
301	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	299	2025-08-04 15:50:16.917+08
302	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	396	2025-08-04 15:50:17.016+08
303	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	358	2025-08-04 15:51:08.986+08
304	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	386	2025-08-04 15:51:09.016+08
305	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	51	2025-08-04 15:51:14.498+08
306	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	207	2025-08-04 15:51:14.657+08
307	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	55	2025-08-04 15:51:19.503+08
308	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	83	2025-08-04 15:51:19.533+08
309	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	314	2025-08-04 15:52:14.944+08
310	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	324	2025-08-04 15:52:14.956+08
311	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	310	2025-08-04 15:53:00.954+08
312	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	396	2025-08-04 15:53:01.042+08
313	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	285	2025-08-04 15:53:38.919+08
314	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	326	2025-08-04 15:53:38.959+08
315	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	300	2025-08-04 16:20:02.962+08
316	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	386	2025-08-04 16:20:03.051+08
317	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	306	2025-08-04 16:20:17.045+08
318	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	343	2025-08-04 16:20:17.08+08
319	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	332	2025-08-04 16:21:08.996+08
320	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	390	2025-08-04 16:21:09.056+08
321	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	77	2025-08-04 16:21:14.554+08
322	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	221	2025-08-04 16:21:14.701+08
323	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	65	2025-08-04 16:21:19.539+08
324	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	84	2025-08-04 16:21:19.56+08
325	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	333	2025-08-04 16:22:15.078+08
326	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	340	2025-08-04 16:22:15.086+08
327	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	305	2025-08-04 16:23:01.04+08
328	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	335	2025-08-04 16:23:01.067+08
329	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	296	2025-08-04 16:23:39.024+08
330	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	346	2025-08-04 16:23:39.076+08
331	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	309	2025-08-04 16:50:03.084+08
332	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	379	2025-08-04 16:50:03.156+08
333	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	255	2025-08-04 16:50:16.925+08
334	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	452	2025-08-04 16:50:17.124+08
335	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	299	2025-08-04 16:51:08.971+08
336	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	370	2025-08-04 16:51:09.044+08
337	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	46	2025-08-04 16:51:14.537+08
338	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	204	2025-08-04 16:51:14.693+08
339	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	71	2025-08-04 16:51:19.572+08
340	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	69	2025-08-04 16:51:19.573+08
341	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	291	2025-08-04 16:52:14.975+08
342	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	398	2025-08-04 16:52:15.084+08
343	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	289	2025-08-04 16:53:00.969+08
344	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	393	2025-08-04 16:53:01.075+08
345	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	285	2025-08-04 16:53:39.062+08
346	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	309	2025-08-04 16:53:39.088+08
347	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	303	2025-08-04 17:20:03.021+08
348	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	408	2025-08-04 17:20:03.128+08
349	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	277	2025-08-04 17:20:16.983+08
350	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	380	2025-08-04 17:20:17.089+08
351	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	313	2025-08-04 17:21:09.028+08
352	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	385	2025-08-04 17:21:09.102+08
353	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	35	2025-08-04 17:21:14.568+08
354	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	195	2025-08-04 17:21:14.731+08
355	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	70	2025-08-04 17:21:19.599+08
356	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	75	2025-08-04 17:21:19.607+08
357	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	318	2025-08-04 17:22:15.011+08
358	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	389	2025-08-04 17:22:15.084+08
359	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	176	2025-08-04 17:23:00.868+08
360	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	40	2025-08-04 17:23:01.577+08
361	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	316	2025-08-04 17:23:39.003+08
362	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	379	2025-08-04 17:23:39.068+08
363	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	430	2025-08-04 17:50:03.222+08
364	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	488	2025-08-04 17:50:03.285+08
365	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	329	2025-08-04 17:50:17.046+08
366	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	416	2025-08-04 17:50:17.135+08
367	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	314	2025-08-04 17:51:09.068+08
368	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	431	2025-08-04 17:51:09.189+08
369	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	53	2025-08-04 17:51:14.606+08
370	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	203	2025-08-04 17:51:14.758+08
371	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	49	2025-08-04 17:51:19.605+08
372	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	65	2025-08-04 17:51:19.624+08
373	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	325	2025-08-04 17:52:15.07+08
374	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	390	2025-08-04 17:52:15.139+08
375	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	350	2025-08-04 17:53:01.101+08
376	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	426	2025-08-04 17:53:01.179+08
377	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	332	2025-08-04 17:53:39.06+08
378	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	367	2025-08-04 17:53:39.097+08
379	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	stopped	qBittorrent/4.6.5	323	2025-08-04 18:10:12.821+08
380	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	stopped	qBittorrent/4.6.5	413	2025-08-04 18:10:12.913+08
381	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	290	2025-08-04 18:20:03.041+08
382	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	390	2025-08-04 18:20:03.143+08
383	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	329	2025-08-04 18:20:17.151+08
384	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	333	2025-08-04 18:20:17.157+08
385	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	287	2025-08-04 18:21:09.029+08
386	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	405	2025-08-04 18:21:09.149+08
387	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	34	2025-08-04 18:21:14.607+08
388	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	197	2025-08-04 18:21:14.773+08
389	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	39	2025-08-04 18:21:19.616+08
390	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	44	2025-08-04 18:21:19.623+08
391	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	323	2025-08-04 18:22:15.068+08
392	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	428	2025-08-04 18:22:15.175+08
393	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	329	2025-08-04 18:23:01.161+08
394	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	331	2025-08-04 18:23:01.165+08
395	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	289	2025-08-04 18:50:03.121+08
396	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	347	2025-08-04 18:50:03.182+08
397	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	323	2025-08-04 18:50:17.193+08
398	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	322	2025-08-04 18:50:17.194+08
399	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	331	2025-08-04 18:51:09.106+08
400	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	396	2025-08-04 18:51:09.173+08
401	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	26	2025-08-04 18:51:14.622+08
402	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	193	2025-08-04 18:51:14.791+08
403	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	69	2025-08-04 18:51:19.667+08
404	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	67	2025-08-04 18:51:19.671+08
405	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	294	2025-08-04 18:52:15.171+08
406	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	312	2025-08-04 18:52:15.191+08
407	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	295	2025-08-04 18:53:01.075+08
408	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	402	2025-08-04 18:53:01.184+08
409	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	174	2025-08-04 19:20:02.968+08
410	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	45	2025-08-04 19:20:03.689+08
411	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	302	2025-08-04 19:20:17.109+08
412	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	372	2025-08-04 19:20:17.182+08
413	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	298	2025-08-04 19:21:06.856+08
414	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	351	2025-08-04 19:21:06.911+08
415	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	35	2025-08-04 19:21:12.336+08
416	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	196	2025-08-04 19:21:12.504+08
417	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	50	2025-08-04 19:21:17.363+08
418	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	50	2025-08-04 19:21:17.367+08
419	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	316	2025-08-04 19:22:12.806+08
420	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	383	2025-08-04 19:22:12.875+08
421	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	323	2025-08-04 19:22:58.798+08
422	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	374	2025-08-04 19:22:58.85+08
423	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	323	2025-08-04 19:50:00.837+08
424	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	393	2025-08-04 19:50:00.91+08
425	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	321	2025-08-04 19:50:14.827+08
426	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	389	2025-08-04 19:50:14.897+08
427	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	298	2025-08-04 19:51:06.816+08
428	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	404	2025-08-04 19:51:06.924+08
429	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	30	2025-08-04 19:51:12.368+08
430	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	194	2025-08-04 19:51:12.534+08
431	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	71	2025-08-04 19:51:17.398+08
432	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	70	2025-08-04 19:51:17.399+08
433	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	288	2025-08-04 19:52:12.798+08
434	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	373	2025-08-04 19:52:12.886+08
435	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	294	2025-08-04 19:52:58.792+08
436	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	389	2025-08-04 19:52:58.889+08
437	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	321	2025-08-04 20:20:00.836+08
438	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	382	2025-08-04 20:20:00.899+08
439	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	295	2025-08-04 20:20:14.831+08
440	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	385	2025-08-04 20:20:14.924+08
441	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	301	2025-08-04 20:21:06.837+08
442	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	380	2025-08-04 20:21:06.918+08
443	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	37	2025-08-04 20:21:12.391+08
444	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	207	2025-08-04 20:21:12.563+08
445	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	62	2025-08-04 20:21:17.418+08
446	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	68	2025-08-04 20:21:17.422+08
447	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	293	2025-08-04 20:22:12.904+08
448	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	361	2025-08-04 20:22:12.974+08
449	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	291	2025-08-04 20:22:58.825+08
450	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	update	qBittorrent/4.6.5	348	2025-08-04 20:22:58.886+08
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, icon, sort_order, active, created_at, updated_at) FROM stdin;
1	电影	各类电影资源	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
3	音乐	音乐专辑、单曲	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
4	软件	应用程序、工具软件	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
5	游戏	PC游戏、手机游戏	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
6	图书	电子书、有声读物	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
7	学习资料	教程、课程、学术资料	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
8	其他	其他类型资源	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
2	剧集	电视剧、综艺节目	\N	0	t	2025-07-30 14:00:19.723+08	2025-07-30 14:00:19.723+08
\.


--
-- Data for Name: downloads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.downloads (id, user_id, torrent_id, uploaded, downloaded, "left", status, last_announce, peer_id, ip, port, user_agent, created_at, updated_at) FROM stdin;
21	15	19	0	0	9720697117	downloading	\N	\N	172.21.77.185	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 22:18:53.891+08	2025-08-03 22:18:53.891+08
23	16	20	0	0	5199876277	downloading	\N	\N	172.23.69.233	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 22:31:29.049+08	2025-08-03 22:31:29.049+08
24	16	19	0	0	9720697117	downloading	\N	\N	172.23.69.233	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 22:33:21.46+08	2025-08-03 22:33:21.46+08
25	18	20	0	0	5199876277	downloading	\N	\N	172.23.90.2	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0	2025-08-03 22:36:47.163+08	2025-08-03 22:36:47.163+08
26	18	21	0	0	37116375178	downloading	\N	\N	172.23.90.2	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0	2025-08-03 22:38:52.685+08	2025-08-03 22:38:52.685+08
27	17	22	0	0	48938344022	downloading	\N	\N	172.21.134.69	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 22:41:49.9+08	2025-08-03 22:41:49.9+08
28	15	25	0	0	1331815691	downloading	\N	\N	172.21.77.185	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 23:38:24.138+08	2025-08-03 23:38:24.138+08
29	15	24	0	0	8152837144	downloading	\N	\N	172.21.77.185	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 23:40:01.332+08	2025-08-03 23:40:01.332+08
22	15	20	0	0	5199876277	downloading	2025-08-03 23:44:19.478+08	\N	172.21.77.185	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 22:22:13.034+08	2025-08-03 23:44:19.479+08
\.


--
-- Data for Name: info_hash_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.info_hash_variants (id, original_torrent_id, variant_info_hash, user_passkey, announce_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: peers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.peers (id, user_id, torrent_id, info_hash, peer_id, ip, port, uploaded, downloaded, "left", status, user_agent, key, last_announce, first_announce, announces, created_at, updated_at) FROM stdin;
26	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-kNo3f~j0jyIz	172.21.77.185	27052	5205172357	5199876277	0	stopped	qBittorrent/5.1.2	B47CD1DC	2025-08-03 23:43:59.692+08	2025-08-03 22:22:25.761+08	5	2025-08-03 22:22:25.762+08	2025-08-03 23:43:59.692+08
49	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-zyx3.aT_0sqD	172.21.72.127	27633	0	0	0	stopped	qBittorrent/4.6.5	88E158E5	2025-08-04 18:10:12.912+08	2025-08-04 10:23:38.551+08	26	2025-08-04 10:23:38.551+08	2025-08-04 18:10:12.912+08
42	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-*JpiEi0Wh49j	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	152511D2	2025-08-04 20:20:00.897+08	2025-08-04 10:20:02.182+08	34	2025-08-04 10:20:02.183+08	2025-08-04 20:20:00.898+08
43	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-mIsB(VnCdO-O	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	77F920FF	2025-08-04 20:20:14.922+08	2025-08-04 10:20:16.621+08	33	2025-08-04 10:20:16.621+08	2025-08-04 20:20:14.922+08
25	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-5fL64bmCKN)J	172.21.77.185	27052	0	0	5199876277	stopped	qBittorrent/5.1.2	B47CD1DC	2025-08-03 22:22:05.631+08	2025-08-03 22:22:05.631+08	1	2025-08-03 22:22:05.631+08	2025-08-03 22:22:05.631+08
44	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-V!8VIWAebwP4	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	17BDED9F	2025-08-04 20:21:06.917+08	2025-08-04 10:20:32.198+08	35	2025-08-04 10:20:32.199+08	2025-08-04 20:21:06.917+08
45	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-dINd)rnR0n_m	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	F8598EB9	2025-08-04 20:21:12.561+08	2025-08-04 10:21:14.832+08	34	2025-08-04 10:21:14.832+08	2025-08-04 20:21:12.561+08
46	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-rQaofB8DlBhT	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	E3EFED62	2025-08-04 20:21:17.42+08	2025-08-04 10:21:19.394+08	26	2025-08-04 10:21:19.395+08	2025-08-04 20:21:17.42+08
47	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-(7Znu9A8*yzh	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	B7480B15	2025-08-04 20:22:12.972+08	2025-08-04 10:21:25.257+08	36	2025-08-04 10:21:25.257+08	2025-08-04 20:22:12.972+08
48	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FtBS8st!M.Bo	172.21.72.127	27633	0	0	0	started	qBittorrent/4.6.5	18FE6F3E	2025-08-04 20:22:58.884+08	2025-08-04 10:23:00.792+08	34	2025-08-04 10:23:00.792+08	2025-08-04 20:22:58.884+08
35	1	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB4650-eINg4wdG9qw-	172.21.48.71	27633	1331890822	0	0	stopped	qBittorrent/4.6.5	63D3AB5E	2025-08-04 00:26:10.99+08	2025-08-03 22:58:18.498+08	4	2025-08-03 22:58:18.498+08	2025-08-04 00:26:10.99+08
23	1	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB4650-FZiIvH0Nre9C	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	0161D7F2	2025-08-04 00:26:11.101+08	2025-08-03 22:19:23.321+08	7	2025-08-03 22:19:23.322+08	2025-08-04 00:26:11.101+08
27	1	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB4650-s9v1AoqZxr9B	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	8A41255F	2025-08-04 00:26:11.154+08	2025-08-03 22:31:04.372+08	5	2025-08-03 22:31:04.372+08	2025-08-04 00:26:11.154+08
32	18	21	ac28b60bfde1b577c87c9259b101734cda3ee98a	-qB502A--orjn9q!(6O!	172.23.90.2	42147	0	0	37116375178	stopped	qBittorrent Enhanced/5.0.2.10	80E0F195	2025-08-03 22:41:04.177+08	2025-08-03 22:39:23.459+08	4	2025-08-03 22:39:23.459+08	2025-08-03 22:41:04.178+08
28	16	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-nPadoVR5VdA.	172.23.69.233	13761	0	0	5199876277	stopped	qBittorrent/5.1.2	0A169B70	2025-08-03 22:47:53.308+08	2025-08-03 22:31:55.787+08	6	2025-08-03 22:31:55.787+08	2025-08-03 22:47:53.308+08
31	1	22	810320f078c0e712f31ad96c11c8c1f892271693	-qB4650-oS.-Q0~36czL	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	C84AC90C	2025-08-04 00:26:11.23+08	2025-08-03 22:38:02.379+08	5	2025-08-03 22:38:02.38+08	2025-08-04 00:26:11.23+08
34	1	24	3724892068a31bfa312744a985f2a9df8068455a	-qB4650-gpWAa2wVlSW*	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	5F4205D4	2025-08-04 00:26:11.331+08	2025-08-03 22:55:48.366+08	4	2025-08-03 22:55:48.366+08	2025-08-04 00:26:11.331+08
33	1	23	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	-qB4650-I0BBbPZnluK1	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	70AC0CD5	2025-08-04 00:26:11.392+08	2025-08-03 22:52:51.383+08	4	2025-08-03 22:52:51.383+08	2025-08-04 00:26:11.393+08
36	1	26	e235f005479fb4711e8390e95ec621e8b0b4c029	-qB4650-LWitLhaz9!aM	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	51C63B60	2025-08-04 00:26:11.399+08	2025-08-03 23:03:31.338+08	4	2025-08-03 23:03:31.338+08	2025-08-04 00:26:11.399+08
38	1	28	cb60ff4e84713c23732d8ab4e549ebde4f5029db	-qB4650-wjBi*ZTy1aX)	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	D348F09E	2025-08-04 00:26:11.454+08	2025-08-03 23:12:45.772+08	4	2025-08-03 23:12:45.772+08	2025-08-04 00:26:11.454+08
24	1	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB4650-qlFU7OVn28FV	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	BBCEF334	2025-08-04 00:26:11.458+08	2025-08-03 22:22:04.079+08	7	2025-08-03 22:22:04.079+08	2025-08-04 00:26:11.458+08
37	1	27	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	-qB4650-xbKLe*iz3Ydi	172.21.48.71	27633	0	0	0	stopped	qBittorrent/4.6.5	622CED64	2025-08-04 00:26:11.574+08	2025-08-03 23:11:43.02+08	4	2025-08-03 23:11:43.02+08	2025-08-04 00:26:11.574+08
29	16	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-3J~Olhb9_B~g	172.23.69.233	13761	0	9720697117	0	completed	qBittorrent/5.1.2	B8FA2EFB	2025-08-04 00:41:49.486+08	2025-08-03 22:33:41.237+08	7	2025-08-03 22:33:41.237+08	2025-08-04 00:41:49.486+08
22	15	19	60fa5be08451b5a7ee0cda878d8f411efc4b2276	-qB5120-s-*4V*6Nr.!*	172.21.77.185	27052	0	2634191133	0	completed	qBittorrent/5.1.2	56AFE86C	2025-08-04 00:42:18.946+08	2025-08-03 22:19:01.742+08	7	2025-08-03 22:19:01.742+08	2025-08-04 00:42:18.946+08
41	15	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB5120-tWGL2W0e.S*A	172.21.77.185	27052	0	0	5199876277	started	qBittorrent/5.1.2	B47CD1DC	2025-08-04 00:42:40.964+08	2025-08-03 23:44:41.028+08	6	2025-08-03 23:44:41.029+08	2025-08-04 00:42:40.964+08
40	15	24	3724892068a31bfa312744a985f2a9df8068455a	-qB5120-gRk5wVtgjlo*	172.21.77.185	27052	0	0	8152837144	started	qBittorrent/5.1.2	F37D4134	2025-08-04 00:42:43.635+08	2025-08-03 23:40:07.524+08	6	2025-08-03 23:40:07.524+08	2025-08-04 00:42:43.635+08
39	15	25	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	-qB5120-VDJA69XDV4PD	172.21.77.185	27052	0	103048459	0	completed	qBittorrent/5.1.2	4BE0ED38	2025-08-04 00:45:59.087+08	2025-08-03 23:38:33.867+08	9	2025-08-03 23:38:33.867+08	2025-08-04 00:45:59.087+08
30	18	20	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	-qB502A-Ag~s0S5Yea*4	172.23.90.2	42147	0	5162553525	0	completed	qBittorrent Enhanced/5.0.2.10	3B60C64D	2025-08-04 00:46:19.925+08	2025-08-03 22:37:49.894+08	7	2025-08-03 22:37:49.894+08	2025-08-04 00:46:19.925+08
\.


--
-- Data for Name: torrents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.torrents (id, name, description, info_hash, size, file_count, uploader_id, category_id, status, seeders, leechers, completed, torrent_file, nfo_file, image_files, tags, free_leech, double_upload, free_leech_until, created_at, updated_at, review_reason, reviewed_by, reviewed_at) FROM stdin;
26	伤物语	伤物语三部曲 电影BD	e235f005479fb4711e8390e95ec621e8b0b4c029	9558222583	14	1	1	approved	0	0	0	1754233356731-2c12d3d048568775.torrent	\N	[]	[]	f	f	\N	2025-08-03 23:02:36.822+08	2025-08-03 23:02:42.409+08	\N	1	2025-08-03 23:02:42.409+08
27	恶魔人crybaby	恶魔人crybaby BD	9bb2a181666acce8a1544210e7b0c1f7e5bc8041	4047031992	12	1	2	approved	0	0	0	1754233803740-eb4429f0082d47ce.torrent	\N	[]	[]	f	f	\N	2025-08-03 23:10:03.829+08	2025-08-03 23:10:11.798+08	\N	1	2025-08-03 23:10:11.798+08
19	机动战士高达0080	高达0080 BD	60fa5be08451b5a7ee0cda878d8f411efc4b2276	9720697117	51	1	2	approved	0	2	0	1754230715017-64ca8b5de4f65afa.torrent	\N	[]	[]	f	f	\N	2025-08-03 22:18:35.132+08	2025-08-03 22:33:21.658+08	\N	1	2025-08-03 22:18:41.267+08
20	败犬女主太多了	败犬女主太多了 webrip	b5dd40cc8ecbb87e59593f0e905c28c69b607adc	5199876277	12	1	2	approved	0	3	0	1754230906111-34c68028dfd6d069.torrent	\N	[]	[]	f	f	\N	2025-08-03 22:21:46.192+08	2025-08-03 22:36:47.53+08	\N	1	2025-08-03 22:21:54.49+08
21	命运石之门	命运石之门BD	ac28b60bfde1b577c87c9259b101734cda3ee98a	37116375178	107	1	2	approved	0	1	0	1754231360500-8e1b1244bc475142.torrent	\N	[]	["动画"]	f	f	\N	2025-08-03 22:29:20.637+08	2025-08-03 22:38:52.77+08	\N	1	2025-08-03 22:29:31.732+08
22	忍者杀手	忍者杀手动画BD	810320f078c0e712f31ad96c11c8c1f892271693	48938344022	88	1	2	approved	0	1	0	1754231852830-7f9583ab86d14250.torrent	\N	[]	[]	f	f	\N	2025-08-03 22:37:32.929+08	2025-08-03 22:41:49.934+08	\N	1	2025-08-03 22:37:39.899+08
23	星际牛仔	星际牛仔BD	7b933d0202bf16bc470c65c3f30c328b9fb12c4b	16366301800	27	1	2	approved	0	0	0	1754232534979-f73592bfa4c60dbd.torrent	\N	[]	[]	f	f	\N	2025-08-03 22:48:55.059+08	2025-08-03 22:49:01.322+08	\N	1	2025-08-03 22:49:01.321+08
28	皇家国教骑士团	皇家国教骑士团 OVA BD\r\n	cb60ff4e84713c23732d8ab4e549ebde4f5029db	10395852685	10	1	2	approved	0	0	0	1754233907855-5bd9cb20e13b1fe5.torrent	\N	[]	[]	f	f	\N	2025-08-03 23:11:47.907+08	2025-08-03 23:11:54.59+08	\N	1	2025-08-03 23:11:54.59+08
25	蓦然回首	蓦然回首BD	1ca8cd98400ebb8f094aeab683c718d1b6c900e3	1331815691	1	1	1	approved	0	1	0	1754233043514-84a46ce7a768bc92.torrent	\N	[]	[]	f	f	\N	2025-08-03 22:57:23.58+08	2025-08-03 23:38:24.23+08	\N	1	2025-08-03 22:57:29.314+08
24	girls band cry	GBC webrip	3724892068a31bfa312744a985f2a9df8068455a	8152837144	13	1	2	approved	0	1	0	1754232889833-fbdbfee27be93dc9.torrent	\N	[]	[]	f	f	\N	2025-08-03 22:54:49.917+08	2025-08-03 23:40:01.42+08	\N	1	2025-08-03 22:54:56.35+08
\.


--
-- Data for Name: user_passkeys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_passkeys (id, user_id, passkey, active, last_used, created_at, updated_at) FROM stdin;
2	2	edf6aa9988278abb11a63fa868696e19	t	\N	2025-07-30 18:14:30.726+08	2025-07-30 18:14:30.727+08
3	3	8608ce56f5a6d56a7ac46314d28d573e	t	\N	2025-08-01 00:09:31.199+08	2025-08-01 00:09:31.2+08
4	5	ec9de347391c6a15f524d44b40ac46b8	t	\N	2025-08-01 00:09:31.212+08	2025-08-01 00:09:31.212+08
5	6	5b67582f053c887829f5964a53dfb0ae	t	\N	2025-08-01 00:09:31.214+08	2025-08-01 00:09:31.214+08
6	4	55327012e5807f1d33d6aa3377f7d613	t	\N	2025-08-01 00:09:31.217+08	2025-08-01 00:09:31.217+08
7	7	4f90bd014e99aaf2b3a13be228051002	t	\N	2025-08-01 18:28:04.9+08	2025-08-01 18:28:04.9+08
8	8	a950dfaadae80b86f7253d3d47668ed6	t	\N	2025-08-01 18:28:04.915+08	2025-08-01 18:28:04.915+08
9	9	d5d89b968fc6767081ca8c8b6b8a981c	t	\N	2025-08-01 18:28:04.918+08	2025-08-01 18:28:04.918+08
10	10	7921e1d522525d09c9698361595b9330	t	\N	2025-08-01 18:34:22.317+08	2025-08-01 18:34:22.317+08
11	11	5fc5229b750cc197ad2f86d8e9f3524d	t	\N	2025-08-01 18:34:22.323+08	2025-08-01 18:34:22.323+08
12	12	9c7a0144d8b0b5203166ee7407352c55	t	\N	2025-08-01 18:34:22.326+08	2025-08-01 18:34:22.326+08
13	13	0c71dfe1e37e510bb5b88880c669e7b2	t	\N	2025-08-01 18:49:09.115+08	2025-08-01 18:49:09.116+08
14	14	ff4b17eb3f4eef83b8896fe8024f4d12	t	\N	2025-08-01 18:49:09.123+08	2025-08-01 18:49:09.123+08
17	17	310ecb2fecb38e32f8be0df29ae2952d	t	2025-08-03 19:16:06.967+08	2025-08-03 18:04:20.722+08	2025-08-03 19:16:06.967+08
1	1	3c7ac6a8f6f28624698ce65a52f4fe61	t	2025-08-04 20:22:58.838+08	2025-07-30 18:12:13.771+08	2025-08-04 20:22:58.838+08
16	16	46d5726891815e99a28bbaabd8d7543d	t	2025-08-04 00:41:49.42+08	2025-08-01 23:43:38.793+08	2025-08-04 00:41:49.42+08
15	15	9a5c1a8ea23d8b92a21ecca8751f873f	t	2025-08-04 00:45:59.031+08	2025-08-01 21:44:25.1+08	2025-08-04 00:45:59.031+08
18	18	f8970a340f98f70d308fa1ebb6254fa1	t	2025-08-04 00:46:19.876+08	2025-08-03 22:36:47.238+08	2025-08-04 00:46:19.876+08
\.


--
-- Data for Name: user_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_stats (id, user_id, uploaded, downloaded, seedtime, leechtime, bonus_points, invitations, torrents_uploaded, torrents_seeding, torrents_leeching, created_at, updated_at) FROM stdin;
3	3	0	0	0	0	50.00	0	0	0	0	2025-07-31 23:29:57.072+08	2025-08-01 00:07:57.638+08
5	5	0	0	0	0	50.00	0	0	0	0	2025-07-31 23:36:14.204+08	2025-08-01 00:07:57.643+08
6	6	0	0	0	0	50.00	0	1	0	0	2025-07-31 23:36:49.018+08	2025-08-01 00:07:57.647+08
4	4	0	0	0	0	50.00	0	0	0	0	2025-07-31 23:33:10.929+08	2025-08-01 00:07:57.654+08
7	7	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:26:39.479+08	2025-08-01 18:26:39.479+08
8	8	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:27:00.205+08	2025-08-01 18:27:00.205+08
9	9	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:27:34.87+08	2025-08-01 18:27:34.87+08
10	10	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:28:21.551+08	2025-08-01 18:28:21.551+08
11	11	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:28:51.856+08	2025-08-01 18:28:51.856+08
12	12	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:33:12.435+08	2025-08-01 18:33:12.435+08
13	13	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:35:28.207+08	2025-08-01 18:35:28.207+08
14	14	0	0	0	0	50.00	0	0	0	0	2025-08-01 18:36:18.391+08	2025-08-01 18:36:18.391+08
2	2	0	0	0	0	0.00	0	0	0	0	2025-07-30 14:00:19.914+08	2025-08-02 00:00:00.842+08
17	17	0	1211141357	0	0	50.00	0	0	0	1	2025-08-03 18:03:20.604+08	2025-08-03 23:00:00.667+08
16	16	0	10196526267	0	0	50.00	0	0	0	2	2025-08-01 23:43:23.917+08	2025-08-03 23:09:37.667+08
18	18	0	5199876277	0	0	50.00	0	0	0	2	2025-08-03 22:35:39.333+08	2025-08-03 23:31:58.813+08
1	1	27909864817	0	0	0	22.00	0	23	0	0	2025-07-30 14:00:19.718+08	2025-08-04 00:26:11.005+08
15	15	5205172357	19400169171	0	0	54.00	0	0	0	4	2025-08-01 21:20:40.575+08	2025-08-04 11:00:00.528+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, role, status, avatar, invitation_code, invited_by, last_login, registration_ip, created_at, updated_at) FROM stdin;
14	testuser578054	test1754044578054@example.com	$2b$12$UJaJJuuuB8kPGzQ2mvACZOODtwPZsb.kj750guHLg18rkBdD/ghNK	user	active	\N	\N	\N	2025-08-01 18:36:18.598+08	127.0.0.1	2025-08-01 18:36:18.193+08	2025-08-01 18:36:18.598+08
6	user10	kevin655362333@gmail.com	$2b$12$XwpUY4.XRJgrO8gxZd7gJO7c1BIQKffmTVBuSHmN44aLIMvkpP4oW	user	active	\N	\N	\N	\N	::1	2025-07-31 23:36:48.823+08	2025-07-31 23:36:48.823+08
4	user1	qdsxhkw@126.com	$2b$12$u57cQBe6hiMFPuo44K917e9HtS0jhZGpmRF9RFhmzmXa4V4BBxIw6	user	active	\N	\N	\N	2025-07-31 23:42:47.361+08	::1	2025-07-31 23:33:10.732+08	2025-07-31 23:42:47.362+08
3	newuser2025	newuser2025@example.com	$2b$12$E64A7URuU/owHKEwU48w3.cRTLZ8RFi/5KWNSs8irdv9/9lNnGZ5W	user	banned	\N	\N	\N	\N	::1	2025-07-31 23:29:56.868+08	2025-08-01 17:36:53.946+08
5	testuser2025	testuser2025@126.com	$2b$12$VObZVXeW00bDfjJTQcXkY.FoYTgxNRFJmoQVGOtN24GEm04gHQLw6	user	inactive	\N	\N	\N	\N	::1	2025-07-31 23:36:13.999+08	2025-08-01 17:37:01.855+08
2	testuser	test@pt.local	$2b$12$xPgiA56CJ.PkLNqjE8VGEeu1wgaGQesrydnv2rBUojherJkmunQvi	user	active	\N	\N	\N	2025-08-01 18:04:14.171+08	\N	2025-07-30 14:00:19.726+08	2025-08-01 18:04:14.171+08
7	testuser999128	test1754043999128@example.com	$2b$12$V5wAPn7CCSnR.diIsLouFe/sCM3PA5HFNhciq9gXUI1BxXwwvSh12	user	active	\N	\N	\N	2025-08-01 18:26:39.684+08	127.0.0.1	2025-08-01 18:26:39.258+08	2025-08-01 18:26:39.684+08
8	testuser019877	test1754044019877@example.com	$2b$12$JWNAUyWhJ1Fp02qlRcL6I.Rs7/nlXVXQ.Z.xqFmus2xCuk1SwcW7K	user	active	\N	\N	\N	2025-08-01 18:27:00.41+08	127.0.0.1	2025-08-01 18:27:00.008+08	2025-08-01 18:27:00.41+08
9	testuser054545	test1754044054545@example.com	$2b$12$9fkpUKlOoy5yCORONk9MTuCQnJVLAPsIFVxX0C2ho5on4ie.7nFVa	user	active	\N	\N	\N	2025-08-01 18:27:35.073+08	127.0.0.1	2025-08-01 18:27:34.674+08	2025-08-01 18:27:35.073+08
10	testuser101201	test1754044101201@example.com	$2b$12$Z.ugecUkjoiq.8.I4OMFYOSA/CgqxP3pRKty8KpIen1DJZYfaaylK	user	active	\N	\N	\N	2025-08-01 18:28:21.758+08	127.0.0.1	2025-08-01 18:28:21.352+08	2025-08-01 18:28:21.759+08
11	testuser131518	test1754044131518@example.com	$2b$12$2N4MsOEwoWAuAkr0RH9zr.Jo7RehArKpuP/.q3wEFu0hsCwK6SwkC	user	active	\N	\N	\N	2025-08-01 18:28:52.063+08	127.0.0.1	2025-08-01 18:28:51.655+08	2025-08-01 18:28:52.063+08
12	testuser392105	test1754044392105@example.com	$2b$12$GFSbt/NwXhRwEf8xWfVngeB2xcR9lNorV5lk35j.bxTO4dU.60Lye	user	active	\N	\N	\N	2025-08-01 18:33:12.643+08	127.0.0.1	2025-08-01 18:33:12.238+08	2025-08-01 18:33:12.643+08
17	507pc1	QDSXhkw@163.com	$2b$12$ggHEalYRgKkx/.BsaFMTlesnz6ibrwaHykXa5Ckkcff.EYJo0E9xC	user	active	\N	\N	\N	2025-08-03 21:55:23.971+08	172.21.134.69	2025-08-03 18:03:20.391+08	2025-08-03 21:55:23.972+08
15	testuser1	duanlf2023@lzu.edu.cn	$2b$12$qx72ElO8XEMu8ZMeiYidbuGWwzWGC3pXvmPuzQHJSV48sx35oy9V6	user	active	\N	\N	\N	2025-08-03 22:09:00.798+08	172.21.77.185	2025-08-01 21:20:40.365+08	2025-08-03 22:09:00.798+08
16	April	1320356075@qq.com	$2b$12$nRLAdBBwkcLUHDM.PJW.sOHUNoqHqHRq7KO22kjNuy0T.1fwiFN8S	user	active	\N	\N	\N	2025-08-03 22:26:03.709+08	172.23.234.194	2025-08-01 23:43:23.716+08	2025-08-03 22:26:03.709+08
18	2163838502	2163838502@qq.com	$2b$12$BFIdOzIyA2Clfp0h.noILe4Fsl1LweE5eTkofoKHGn2HLvMRZyu5e	user	active	\N	\N	\N	\N	172.23.90.2	2025-08-03 22:35:38.962+08	2025-08-03 22:35:38.962+08
13	testuser527859	test1754044527859@example.com	$2b$12$81ZqUud1Aty.NuN6ByoTQeInEHgaNlsFPwb9t/K5Fby96R3r/rpsC	user	inactive	\N	\N	\N	2025-08-01 18:35:28.411+08	127.0.0.1	2025-08-01 18:35:28.007+08	2025-08-03 23:06:11.262+08
1	admin	admin@pt.local	$2b$12$fpiJktCkj1f0LVKrgl8U3.rkxN8gahXpErOb6iMZ027mvdfv.p1K2	admin	active	\N	\N	\N	2025-08-04 10:22:07.22+08	\N	2025-07-30 14:00:19.525+08	2025-08-04 10:22:07.221+08
\.


--
-- Name: announce_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announce_logs_id_seq', 450, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.downloads_id_seq', 29, true);


--
-- Name: info_hash_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.info_hash_variants_id_seq', 13, true);


--
-- Name: peers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.peers_id_seq', 49, true);


--
-- Name: torrents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.torrents_id_seq', 28, true);


--
-- Name: user_passkeys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_passkeys_id_seq', 18, true);


--
-- Name: user_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_stats_id_seq', 18, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: announce_logs announce_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announce_logs
    ADD CONSTRAINT announce_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_name_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key1 UNIQUE (name);


--
-- Name: categories categories_name_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key10 UNIQUE (name);


--
-- Name: categories categories_name_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key11 UNIQUE (name);


--
-- Name: categories categories_name_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key12 UNIQUE (name);


--
-- Name: categories categories_name_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key13 UNIQUE (name);


--
-- Name: categories categories_name_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key14 UNIQUE (name);


--
-- Name: categories categories_name_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key15 UNIQUE (name);


--
-- Name: categories categories_name_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key16 UNIQUE (name);


--
-- Name: categories categories_name_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key17 UNIQUE (name);


--
-- Name: categories categories_name_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key18 UNIQUE (name);


--
-- Name: categories categories_name_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key19 UNIQUE (name);


--
-- Name: categories categories_name_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key2 UNIQUE (name);


--
-- Name: categories categories_name_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key20 UNIQUE (name);


--
-- Name: categories categories_name_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key21 UNIQUE (name);


--
-- Name: categories categories_name_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key22 UNIQUE (name);


--
-- Name: categories categories_name_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key23 UNIQUE (name);


--
-- Name: categories categories_name_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key24 UNIQUE (name);


--
-- Name: categories categories_name_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key25 UNIQUE (name);


--
-- Name: categories categories_name_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key26 UNIQUE (name);


--
-- Name: categories categories_name_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key27 UNIQUE (name);


--
-- Name: categories categories_name_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key28 UNIQUE (name);


--
-- Name: categories categories_name_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key29 UNIQUE (name);


--
-- Name: categories categories_name_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key3 UNIQUE (name);


--
-- Name: categories categories_name_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key30 UNIQUE (name);


--
-- Name: categories categories_name_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key31 UNIQUE (name);


--
-- Name: categories categories_name_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key32 UNIQUE (name);


--
-- Name: categories categories_name_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key33 UNIQUE (name);


--
-- Name: categories categories_name_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key34 UNIQUE (name);


--
-- Name: categories categories_name_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key35 UNIQUE (name);


--
-- Name: categories categories_name_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key36 UNIQUE (name);


--
-- Name: categories categories_name_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key37 UNIQUE (name);


--
-- Name: categories categories_name_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key38 UNIQUE (name);


--
-- Name: categories categories_name_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key39 UNIQUE (name);


--
-- Name: categories categories_name_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key4 UNIQUE (name);


--
-- Name: categories categories_name_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key40 UNIQUE (name);


--
-- Name: categories categories_name_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key41 UNIQUE (name);


--
-- Name: categories categories_name_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key42 UNIQUE (name);


--
-- Name: categories categories_name_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key43 UNIQUE (name);


--
-- Name: categories categories_name_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key44 UNIQUE (name);


--
-- Name: categories categories_name_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key45 UNIQUE (name);


--
-- Name: categories categories_name_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key46 UNIQUE (name);


--
-- Name: categories categories_name_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key47 UNIQUE (name);


--
-- Name: categories categories_name_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key48 UNIQUE (name);


--
-- Name: categories categories_name_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key49 UNIQUE (name);


--
-- Name: categories categories_name_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key5 UNIQUE (name);


--
-- Name: categories categories_name_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key50 UNIQUE (name);


--
-- Name: categories categories_name_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key51 UNIQUE (name);


--
-- Name: categories categories_name_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key52 UNIQUE (name);


--
-- Name: categories categories_name_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key53 UNIQUE (name);


--
-- Name: categories categories_name_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key54 UNIQUE (name);


--
-- Name: categories categories_name_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key55 UNIQUE (name);


--
-- Name: categories categories_name_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key56 UNIQUE (name);


--
-- Name: categories categories_name_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key57 UNIQUE (name);


--
-- Name: categories categories_name_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key58 UNIQUE (name);


--
-- Name: categories categories_name_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key59 UNIQUE (name);


--
-- Name: categories categories_name_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key6 UNIQUE (name);


--
-- Name: categories categories_name_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key60 UNIQUE (name);


--
-- Name: categories categories_name_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key61 UNIQUE (name);


--
-- Name: categories categories_name_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key62 UNIQUE (name);


--
-- Name: categories categories_name_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key63 UNIQUE (name);


--
-- Name: categories categories_name_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key64 UNIQUE (name);


--
-- Name: categories categories_name_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key65 UNIQUE (name);


--
-- Name: categories categories_name_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key66 UNIQUE (name);


--
-- Name: categories categories_name_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key67 UNIQUE (name);


--
-- Name: categories categories_name_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key68 UNIQUE (name);


--
-- Name: categories categories_name_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key69 UNIQUE (name);


--
-- Name: categories categories_name_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key7 UNIQUE (name);


--
-- Name: categories categories_name_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key70 UNIQUE (name);


--
-- Name: categories categories_name_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key71 UNIQUE (name);


--
-- Name: categories categories_name_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key72 UNIQUE (name);


--
-- Name: categories categories_name_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key73 UNIQUE (name);


--
-- Name: categories categories_name_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key74 UNIQUE (name);


--
-- Name: categories categories_name_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key75 UNIQUE (name);


--
-- Name: categories categories_name_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key76 UNIQUE (name);


--
-- Name: categories categories_name_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key77 UNIQUE (name);


--
-- Name: categories categories_name_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key78 UNIQUE (name);


--
-- Name: categories categories_name_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key79 UNIQUE (name);


--
-- Name: categories categories_name_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key8 UNIQUE (name);


--
-- Name: categories categories_name_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key80 UNIQUE (name);


--
-- Name: categories categories_name_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key81 UNIQUE (name);


--
-- Name: categories categories_name_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key82 UNIQUE (name);


--
-- Name: categories categories_name_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key83 UNIQUE (name);


--
-- Name: categories categories_name_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key84 UNIQUE (name);


--
-- Name: categories categories_name_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key85 UNIQUE (name);


--
-- Name: categories categories_name_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key86 UNIQUE (name);


--
-- Name: categories categories_name_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key87 UNIQUE (name);


--
-- Name: categories categories_name_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key88 UNIQUE (name);


--
-- Name: categories categories_name_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key89 UNIQUE (name);


--
-- Name: categories categories_name_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key9 UNIQUE (name);


--
-- Name: categories categories_name_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key90 UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: downloads downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_pkey PRIMARY KEY (id);


--
-- Name: info_hash_variants info_hash_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_pkey PRIMARY KEY (id);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key1 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key10 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key11 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key12 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key13 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key14 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key15 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key16 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key2 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key3 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key4 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key5 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key6 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key7 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key8 UNIQUE (variant_info_hash);


--
-- Name: info_hash_variants info_hash_variants_variant_info_hash_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_variant_info_hash_key9 UNIQUE (variant_info_hash);


--
-- Name: peers peers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peers
    ADD CONSTRAINT peers_pkey PRIMARY KEY (id);


--
-- Name: torrents torrents_info_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key1 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key10 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key11 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key12 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key13 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key14 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key15 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key16 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key17 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key18 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key19 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key2 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key20 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key21 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key22 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key23 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key24 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key25 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key26 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key27 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key28 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key29 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key3 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key30 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key31 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key32 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key33 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key34 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key35 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key36 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key37 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key38 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key39 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key4 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key40 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key41 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key42 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key43 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key44 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key45 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key46 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key47 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key48 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key49 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key5 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key50 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key51 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key52 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key53 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key54 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key55 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key56 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key57 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key58 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key59 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key6 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key60 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key61 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key62 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key63 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key64 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key65 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key66 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key67 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key68 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key69 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key7 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key70 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key71 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key72 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key73 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key74 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key75 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key76 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key77 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key78 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key79 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key8 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key80 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key81 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key82 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key83 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key84 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key85 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key86 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key87 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key88 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key89 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key9 UNIQUE (info_hash);


--
-- Name: torrents torrents_info_hash_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key90 UNIQUE (info_hash);


--
-- Name: torrents torrents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_pkey PRIMARY KEY (id);


--
-- Name: user_passkeys user_passkeys_passkey_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key1 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key10 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key11 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key12 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key13 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key14 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key15 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key16 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key17 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key18 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key19 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key2 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key20 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key21 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key22 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key23 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key24 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key25 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key26 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key27 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key28 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key29 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key3 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key30 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key31 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key32 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key33 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key34 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key35 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key36 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key37 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key38 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key39 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key4 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key40 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key41 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key42 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key43 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key44 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key45 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key46 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key47 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key48 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key49 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key5 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key50 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key51 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key52 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key53 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key54 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key55 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key56 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key57 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key58 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key59 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key6 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key60 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key61 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key62 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key63 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key64 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key65 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key66 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key67 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key68 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key69 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key7 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key70 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key71 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key72 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key73 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key74 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key75 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key76 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key77 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key78 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key79 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key8 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key80 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key81 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key82 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key83 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key84 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key85 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key86 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key87 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key88 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key89 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key9 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_passkey_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key90 UNIQUE (passkey);


--
-- Name: user_passkeys user_passkeys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_pkey PRIMARY KEY (id);


--
-- Name: user_passkeys user_passkeys_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_user_id_key UNIQUE (user_id);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (id);


--
-- Name: user_stats user_stats_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_email_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key10 UNIQUE (email);


--
-- Name: users users_email_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key11 UNIQUE (email);


--
-- Name: users users_email_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key12 UNIQUE (email);


--
-- Name: users users_email_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key13 UNIQUE (email);


--
-- Name: users users_email_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key14 UNIQUE (email);


--
-- Name: users users_email_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key15 UNIQUE (email);


--
-- Name: users users_email_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key16 UNIQUE (email);


--
-- Name: users users_email_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key17 UNIQUE (email);


--
-- Name: users users_email_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key18 UNIQUE (email);


--
-- Name: users users_email_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key19 UNIQUE (email);


--
-- Name: users users_email_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key2 UNIQUE (email);


--
-- Name: users users_email_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key20 UNIQUE (email);


--
-- Name: users users_email_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key21 UNIQUE (email);


--
-- Name: users users_email_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key22 UNIQUE (email);


--
-- Name: users users_email_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key23 UNIQUE (email);


--
-- Name: users users_email_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key24 UNIQUE (email);


--
-- Name: users users_email_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key25 UNIQUE (email);


--
-- Name: users users_email_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key26 UNIQUE (email);


--
-- Name: users users_email_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key27 UNIQUE (email);


--
-- Name: users users_email_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key28 UNIQUE (email);


--
-- Name: users users_email_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key29 UNIQUE (email);


--
-- Name: users users_email_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key3 UNIQUE (email);


--
-- Name: users users_email_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key30 UNIQUE (email);


--
-- Name: users users_email_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key31 UNIQUE (email);


--
-- Name: users users_email_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key32 UNIQUE (email);


--
-- Name: users users_email_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key33 UNIQUE (email);


--
-- Name: users users_email_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key34 UNIQUE (email);


--
-- Name: users users_email_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key35 UNIQUE (email);


--
-- Name: users users_email_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key36 UNIQUE (email);


--
-- Name: users users_email_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key37 UNIQUE (email);


--
-- Name: users users_email_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key38 UNIQUE (email);


--
-- Name: users users_email_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key39 UNIQUE (email);


--
-- Name: users users_email_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key4 UNIQUE (email);


--
-- Name: users users_email_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key40 UNIQUE (email);


--
-- Name: users users_email_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key41 UNIQUE (email);


--
-- Name: users users_email_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key42 UNIQUE (email);


--
-- Name: users users_email_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key43 UNIQUE (email);


--
-- Name: users users_email_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key44 UNIQUE (email);


--
-- Name: users users_email_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key45 UNIQUE (email);


--
-- Name: users users_email_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key46 UNIQUE (email);


--
-- Name: users users_email_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key47 UNIQUE (email);


--
-- Name: users users_email_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key48 UNIQUE (email);


--
-- Name: users users_email_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key49 UNIQUE (email);


--
-- Name: users users_email_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key5 UNIQUE (email);


--
-- Name: users users_email_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key50 UNIQUE (email);


--
-- Name: users users_email_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key51 UNIQUE (email);


--
-- Name: users users_email_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key52 UNIQUE (email);


--
-- Name: users users_email_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key53 UNIQUE (email);


--
-- Name: users users_email_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key54 UNIQUE (email);


--
-- Name: users users_email_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key55 UNIQUE (email);


--
-- Name: users users_email_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key56 UNIQUE (email);


--
-- Name: users users_email_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key57 UNIQUE (email);


--
-- Name: users users_email_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key58 UNIQUE (email);


--
-- Name: users users_email_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key59 UNIQUE (email);


--
-- Name: users users_email_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key6 UNIQUE (email);


--
-- Name: users users_email_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key60 UNIQUE (email);


--
-- Name: users users_email_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key61 UNIQUE (email);


--
-- Name: users users_email_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key62 UNIQUE (email);


--
-- Name: users users_email_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key63 UNIQUE (email);


--
-- Name: users users_email_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key64 UNIQUE (email);


--
-- Name: users users_email_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key65 UNIQUE (email);


--
-- Name: users users_email_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key66 UNIQUE (email);


--
-- Name: users users_email_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key67 UNIQUE (email);


--
-- Name: users users_email_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key68 UNIQUE (email);


--
-- Name: users users_email_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key69 UNIQUE (email);


--
-- Name: users users_email_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key7 UNIQUE (email);


--
-- Name: users users_email_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key70 UNIQUE (email);


--
-- Name: users users_email_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key71 UNIQUE (email);


--
-- Name: users users_email_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key72 UNIQUE (email);


--
-- Name: users users_email_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key73 UNIQUE (email);


--
-- Name: users users_email_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key74 UNIQUE (email);


--
-- Name: users users_email_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key75 UNIQUE (email);


--
-- Name: users users_email_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key76 UNIQUE (email);


--
-- Name: users users_email_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key77 UNIQUE (email);


--
-- Name: users users_email_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key78 UNIQUE (email);


--
-- Name: users users_email_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key79 UNIQUE (email);


--
-- Name: users users_email_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key8 UNIQUE (email);


--
-- Name: users users_email_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key80 UNIQUE (email);


--
-- Name: users users_email_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key81 UNIQUE (email);


--
-- Name: users users_email_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key82 UNIQUE (email);


--
-- Name: users users_email_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key83 UNIQUE (email);


--
-- Name: users users_email_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key84 UNIQUE (email);


--
-- Name: users users_email_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key85 UNIQUE (email);


--
-- Name: users users_email_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key86 UNIQUE (email);


--
-- Name: users users_email_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key87 UNIQUE (email);


--
-- Name: users users_email_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key88 UNIQUE (email);


--
-- Name: users users_email_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key89 UNIQUE (email);


--
-- Name: users users_email_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key9 UNIQUE (email);


--
-- Name: users users_email_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key90 UNIQUE (email);


--
-- Name: users users_invitation_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key1 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key10 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key11 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key12 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key13 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key14 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key15 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key16 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key17 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key18 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key19 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key2 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key20 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key21 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key22 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key23 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key24 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key25 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key26 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key27 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key28 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key29 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key3 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key30 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key31 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key32 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key33 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key34 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key35 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key36 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key37 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key38 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key39 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key4 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key40 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key41 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key42 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key43 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key44 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key45 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key46 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key47 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key48 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key49 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key5 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key50 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key51 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key52 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key53 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key54 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key55 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key56 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key57 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key58 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key59 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key6 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key60 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key61 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key62 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key63 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key64 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key65 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key66 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key67 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key68 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key69 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key7 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key70 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key71 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key72 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key73 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key74 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key75 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key76 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key77 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key78 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key79 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key8 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key80 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key81 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key82 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key83 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key84 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key85 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key86 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key87 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key88 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key89 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key9 UNIQUE (invitation_code);


--
-- Name: users users_invitation_code_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key90 UNIQUE (invitation_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: users users_username_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key1 UNIQUE (username);


--
-- Name: users users_username_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key10 UNIQUE (username);


--
-- Name: users users_username_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key11 UNIQUE (username);


--
-- Name: users users_username_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key12 UNIQUE (username);


--
-- Name: users users_username_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key13 UNIQUE (username);


--
-- Name: users users_username_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key14 UNIQUE (username);


--
-- Name: users users_username_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key15 UNIQUE (username);


--
-- Name: users users_username_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key16 UNIQUE (username);


--
-- Name: users users_username_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key17 UNIQUE (username);


--
-- Name: users users_username_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key18 UNIQUE (username);


--
-- Name: users users_username_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key19 UNIQUE (username);


--
-- Name: users users_username_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key2 UNIQUE (username);


--
-- Name: users users_username_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key20 UNIQUE (username);


--
-- Name: users users_username_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key21 UNIQUE (username);


--
-- Name: users users_username_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key22 UNIQUE (username);


--
-- Name: users users_username_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key23 UNIQUE (username);


--
-- Name: users users_username_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key24 UNIQUE (username);


--
-- Name: users users_username_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key25 UNIQUE (username);


--
-- Name: users users_username_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key26 UNIQUE (username);


--
-- Name: users users_username_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key27 UNIQUE (username);


--
-- Name: users users_username_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key28 UNIQUE (username);


--
-- Name: users users_username_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key29 UNIQUE (username);


--
-- Name: users users_username_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key3 UNIQUE (username);


--
-- Name: users users_username_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key30 UNIQUE (username);


--
-- Name: users users_username_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key31 UNIQUE (username);


--
-- Name: users users_username_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key32 UNIQUE (username);


--
-- Name: users users_username_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key33 UNIQUE (username);


--
-- Name: users users_username_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key34 UNIQUE (username);


--
-- Name: users users_username_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key35 UNIQUE (username);


--
-- Name: users users_username_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key36 UNIQUE (username);


--
-- Name: users users_username_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key37 UNIQUE (username);


--
-- Name: users users_username_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key38 UNIQUE (username);


--
-- Name: users users_username_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key39 UNIQUE (username);


--
-- Name: users users_username_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key4 UNIQUE (username);


--
-- Name: users users_username_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key40 UNIQUE (username);


--
-- Name: users users_username_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key41 UNIQUE (username);


--
-- Name: users users_username_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key42 UNIQUE (username);


--
-- Name: users users_username_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key43 UNIQUE (username);


--
-- Name: users users_username_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key44 UNIQUE (username);


--
-- Name: users users_username_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key45 UNIQUE (username);


--
-- Name: users users_username_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key46 UNIQUE (username);


--
-- Name: users users_username_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key47 UNIQUE (username);


--
-- Name: users users_username_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key48 UNIQUE (username);


--
-- Name: users users_username_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key49 UNIQUE (username);


--
-- Name: users users_username_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key5 UNIQUE (username);


--
-- Name: users users_username_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key50 UNIQUE (username);


--
-- Name: users users_username_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key51 UNIQUE (username);


--
-- Name: users users_username_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key52 UNIQUE (username);


--
-- Name: users users_username_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key53 UNIQUE (username);


--
-- Name: users users_username_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key54 UNIQUE (username);


--
-- Name: users users_username_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key55 UNIQUE (username);


--
-- Name: users users_username_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key56 UNIQUE (username);


--
-- Name: users users_username_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key57 UNIQUE (username);


--
-- Name: users users_username_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key58 UNIQUE (username);


--
-- Name: users users_username_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key59 UNIQUE (username);


--
-- Name: users users_username_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key6 UNIQUE (username);


--
-- Name: users users_username_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key60 UNIQUE (username);


--
-- Name: users users_username_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key61 UNIQUE (username);


--
-- Name: users users_username_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key62 UNIQUE (username);


--
-- Name: users users_username_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key63 UNIQUE (username);


--
-- Name: users users_username_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key64 UNIQUE (username);


--
-- Name: users users_username_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key65 UNIQUE (username);


--
-- Name: users users_username_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key66 UNIQUE (username);


--
-- Name: users users_username_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key67 UNIQUE (username);


--
-- Name: users users_username_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key68 UNIQUE (username);


--
-- Name: users users_username_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key69 UNIQUE (username);


--
-- Name: users users_username_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key7 UNIQUE (username);


--
-- Name: users users_username_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key70 UNIQUE (username);


--
-- Name: users users_username_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key71 UNIQUE (username);


--
-- Name: users users_username_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key72 UNIQUE (username);


--
-- Name: users users_username_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key73 UNIQUE (username);


--
-- Name: users users_username_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key74 UNIQUE (username);


--
-- Name: users users_username_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key75 UNIQUE (username);


--
-- Name: users users_username_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key76 UNIQUE (username);


--
-- Name: users users_username_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key77 UNIQUE (username);


--
-- Name: users users_username_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key78 UNIQUE (username);


--
-- Name: users users_username_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key79 UNIQUE (username);


--
-- Name: users users_username_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key8 UNIQUE (username);


--
-- Name: users users_username_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key80 UNIQUE (username);


--
-- Name: users users_username_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key81 UNIQUE (username);


--
-- Name: users users_username_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key82 UNIQUE (username);


--
-- Name: users users_username_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key83 UNIQUE (username);


--
-- Name: users users_username_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key84 UNIQUE (username);


--
-- Name: users users_username_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key85 UNIQUE (username);


--
-- Name: users users_username_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key86 UNIQUE (username);


--
-- Name: users users_username_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key87 UNIQUE (username);


--
-- Name: users users_username_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key88 UNIQUE (username);


--
-- Name: users users_username_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key89 UNIQUE (username);


--
-- Name: users users_username_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key9 UNIQUE (username);


--
-- Name: users users_username_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key90 UNIQUE (username);


--
-- Name: announce_logs_announced_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX announce_logs_announced_at ON public.announce_logs USING btree (announced_at);


--
-- Name: announce_logs_info_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX announce_logs_info_hash ON public.announce_logs USING btree (info_hash);


--
-- Name: announce_logs_torrent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX announce_logs_torrent_id ON public.announce_logs USING btree (torrent_id);


--
-- Name: announce_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX announce_logs_user_id ON public.announce_logs USING btree (user_id);


--
-- Name: downloads_last_announce; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX downloads_last_announce ON public.downloads USING btree (last_announce);


--
-- Name: downloads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX downloads_status ON public.downloads USING btree (status);


--
-- Name: downloads_user_id_torrent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX downloads_user_id_torrent_id ON public.downloads USING btree (user_id, torrent_id);


--
-- Name: idx_original_torrent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_original_torrent_id ON public.info_hash_variants USING btree (original_torrent_id);


--
-- Name: idx_variant_info_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_variant_info_hash ON public.info_hash_variants USING btree (variant_info_hash);


--
-- Name: info_hash_variants_original_torrent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX info_hash_variants_original_torrent_id ON public.info_hash_variants USING btree (original_torrent_id);


--
-- Name: info_hash_variants_user_passkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX info_hash_variants_user_passkey ON public.info_hash_variants USING btree (user_passkey);


--
-- Name: info_hash_variants_variant_info_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX info_hash_variants_variant_info_hash ON public.info_hash_variants USING btree (variant_info_hash);


--
-- Name: peers_info_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX peers_info_hash ON public.peers USING btree (info_hash);


--
-- Name: peers_last_announce; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX peers_last_announce ON public.peers USING btree (last_announce);


--
-- Name: peers_torrent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX peers_torrent_id ON public.peers USING btree (torrent_id);


--
-- Name: peers_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX peers_user_id ON public.peers USING btree (user_id);


--
-- Name: peers_user_id_torrent_id_peer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX peers_user_id_torrent_id_peer_id ON public.peers USING btree (user_id, torrent_id, peer_id);


--
-- Name: torrents_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX torrents_category_id ON public.torrents USING btree (category_id);


--
-- Name: torrents_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX torrents_created_at ON public.torrents USING btree (created_at);


--
-- Name: torrents_info_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX torrents_info_hash ON public.torrents USING btree (info_hash);


--
-- Name: torrents_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX torrents_status ON public.torrents USING btree (status);


--
-- Name: torrents_uploader_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX torrents_uploader_id ON public.torrents USING btree (uploader_id);


--
-- Name: user_passkeys_passkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_passkeys_passkey ON public.user_passkeys USING btree (passkey);


--
-- Name: user_passkeys_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_passkeys_user_id ON public.user_passkeys USING btree (user_id);


--
-- Name: announce_logs announce_logs_torrent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announce_logs
    ADD CONSTRAINT announce_logs_torrent_id_fkey FOREIGN KEY (torrent_id) REFERENCES public.torrents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: announce_logs announce_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announce_logs
    ADD CONSTRAINT announce_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: downloads downloads_torrent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_torrent_id_fkey FOREIGN KEY (torrent_id) REFERENCES public.torrents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: downloads downloads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: info_hash_variants info_hash_variants_original_torrent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_hash_variants
    ADD CONSTRAINT info_hash_variants_original_torrent_id_fkey FOREIGN KEY (original_torrent_id) REFERENCES public.torrents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: peers peers_torrent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peers
    ADD CONSTRAINT peers_torrent_id_fkey FOREIGN KEY (torrent_id) REFERENCES public.torrents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: peers peers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peers
    ADD CONSTRAINT peers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: torrents torrents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: torrents torrents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: torrents torrents_uploader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_passkeys user_passkeys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_stats user_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

