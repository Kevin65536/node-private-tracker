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
4	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-TEST-123456789012	127.0.0.1	6881	0	0	100000	started	axios/1.11.0	58	2025-08-01 22:28:58.964+08
5	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-TEST-123456789012	127.0.0.1	6881	0	0	100000	started	axios/1.11.0	58	2025-08-01 22:38:09.919+08
6	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-TEST-123456789012	127.0.0.1	6881	0	0	100000	started	axios/1.11.0	48	2025-08-01 22:38:31.628+08
7	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-TEST-123456789012	127.0.0.1	6881	0	0	100000	started	axios/1.11.0	56	2025-08-01 22:51:00.68+08
8	15	13	529936d5fc5685f79981fdd060687f32fd75e526	-TEST-123456789012	127.0.0.1	6881	0	0	100000	started	axios/1.11.0	13	2025-08-01 22:51:00.706+08
9	1	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB4650-q3OwApylNfKy	172.21.222.169	27633	0	0	0	started	qBittorrent/4.6.5	58	2025-08-01 22:54:05.46+08
10	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB5120-T~q12AEzBrJY	172.21.77.185	27052	0	0	220259	started	qBittorrent/5.1.2	55	2025-08-01 22:56:41.695+08
11	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB5120-T~q12AEzBrJY	172.21.77.185	27052	0	0	220259	stopped	qBittorrent/5.1.2	51	2025-08-01 23:03:14.727+08
12	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB5120-T~q12AEzBrJY	172.21.77.185	27052	0	0	220259	started	qBittorrent/5.1.2	9	2025-08-01 23:03:16.644+08
13	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB5120-T~q12AEzBrJY	172.21.77.185	27052	0	0	220259	stopped	qBittorrent/5.1.2	48	2025-08-01 23:21:45.418+08
14	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB5120-T~q12AEzBrJY	172.21.77.185	27052	0	0	220259	started	qBittorrent/5.1.2	9	2025-08-01 23:21:45.632+08
15	1	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB4650-q3OwApylNfKy	172.21.222.169	27633	0	0	0	update	qBittorrent/4.6.5	52	2025-08-01 23:24:05.459+08
16	1	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB4650-D6UmL7tr.rCf	172.21.222.169	27633	0	0	0	started	qBittorrent/4.6.5	32	2025-08-01 23:25:22.336+08
17	15	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-yrRyNwpw5-XO	172.21.77.185	27052	0	0	475829150	started	qBittorrent/5.1.2	55	2025-08-01 23:25:56.395+08
18	15	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-yrRyNwpw5-XO	172.21.77.185	27052	0	475829150	0	completed	qBittorrent/5.1.2	52	2025-08-01 23:26:41.853+08
19	1	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB4650-2!sY45bQ0YE_	172.21.222.169	27633	0	0	0	started	qBittorrent/4.6.5	16	2025-08-01 23:31:54.324+08
20	15	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-byLx59lmcQ0e	172.21.77.185	27052	0	0	1024468230	started	qBittorrent/5.1.2	12	2025-08-01 23:31:55.549+08
21	15	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-byLx59lmcQ0e	172.21.77.185	27052	0	1024468230	0	completed	qBittorrent/5.1.2	58	2025-08-01 23:33:33.222+08
22	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	started	qBittorrent/5.1.2	54	2025-08-01 23:48:45.764+08
23	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	stopped	qBittorrent/5.1.2	49	2025-08-01 23:49:18.836+08
24	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	started	qBittorrent/5.1.2	9	2025-08-01 23:49:24.787+08
25	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	stopped	qBittorrent/5.1.2	11	2025-08-01 23:50:00.891+08
26	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	started	qBittorrent/5.1.2	8	2025-08-01 23:50:04.404+08
27	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB5120-T~q12AEzBrJY	172.21.77.185	27052	0	0	220259	update	qBittorrent/5.1.2	50	2025-08-01 23:51:45.478+08
28	1	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB4650-q3OwApylNfKy	172.21.222.169	27633	0	0	0	update	qBittorrent/4.6.5	50	2025-08-01 23:54:05.44+08
29	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	stopped	qBittorrent/5.1.2	48	2025-08-01 23:54:58.898+08
30	1	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB4650-D6UmL7tr.rCf	172.21.222.169	27633	475829150	0	0	update	qBittorrent/4.6.5	51	2025-08-01 23:55:22.443+08
31	16	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-BXIooIV5HPY4	172.23.234.194	13761	0	0	475829150	started	qBittorrent/5.1.2	57	2025-08-01 23:55:48.1+08
32	16	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-BXIooIV5HPY4	172.23.234.194	13761	0	475829150	0	completed	qBittorrent/5.1.2	50	2025-08-01 23:56:29.336+08
33	15	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-yrRyNwpw5-XO	172.21.77.185	27052	0	475829150	0	update	qBittorrent/5.1.2	51	2025-08-01 23:56:41.486+08
34	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	started	qBittorrent/5.1.2	9	2025-08-01 23:56:42.407+08
35	1	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB4650-2!sY45bQ0YE_	172.21.222.169	27633	1024468230	0	0	update	qBittorrent/4.6.5	12	2025-08-02 00:01:54.319+08
36	15	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-byLx59lmcQ0e	172.21.77.185	27052	0	1024468230	0	update	qBittorrent/5.1.2	52	2025-08-02 00:03:32.505+08
37	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-i8fB53Uns-E0	172.21.77.185	27052	0	0	436341349	started	qBittorrent/5.1.2	11	2025-08-03 17:57:31.783+08
38	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-i8fB53Uns-E0	172.21.77.185	27052	0	0	436341349	stopped	qBittorrent/5.1.2	48	2025-08-03 17:58:07.405+08
39	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-0Lr8)sktg6Fb	172.21.77.185	27052	0	0	436341349	started	qBittorrent/5.1.2	11	2025-08-03 17:58:17.097+08
40	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-0Lr8)sktg6Fb	172.21.77.185	27052	0	0	436341349	started	qBittorrent/5.1.2	46	2025-08-03 17:59:24.254+08
41	1	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB4650-ENgmH448-Bd)	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	55	2025-08-03 17:59:38.439+08
42	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-0Lr8)sktg6Fb	172.21.77.185	27052	0	436341349	0	completed	qBittorrent/5.1.2	47	2025-08-03 18:00:21.139+08
43	17	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-zWRVF8mzcGr0	172.21.134.69	33657	0	0	436341349	started	qBittorrent/5.1.2	63	2025-08-03 18:05:00.919+08
44	17	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-L)_-lbQ7VTi!	172.21.134.69	33657	0	0	475829150	started	qBittorrent/5.1.2	11	2025-08-03 18:06:01.974+08
45	17	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-*XCa1.TU)hl8	172.21.134.69	33657	0	0	1024468230	started	qBittorrent/5.1.2	7	2025-08-03 18:06:06.081+08
46	17	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-*XCa1.TU)hl8	172.21.134.69	33657	0	0	1024468230	stopped	qBittorrent/5.1.2	46	2025-08-03 18:06:43.001+08
47	17	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-zWRVF8mzcGr0	172.21.134.69	33657	0	0	436341349	stopped	qBittorrent/5.1.2	6	2025-08-03 18:06:44.325+08
48	17	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-L)_-lbQ7VTi!	172.21.134.69	33657	0	0	475829150	stopped	qBittorrent/5.1.2	6	2025-08-03 18:06:45.703+08
49	17	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-*XCa1.TU)hl8	172.21.134.69	33657	0	0	1024468230	started	qBittorrent/5.1.2	5	2025-08-03 18:06:46.89+08
50	17	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-L)_-lbQ7VTi!	172.21.134.69	33657	0	0	475829150	started	qBittorrent/5.1.2	5	2025-08-03 18:06:49.168+08
51	17	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-zWRVF8mzcGr0	172.21.134.69	33657	0	0	436341349	started	qBittorrent/5.1.2	7	2025-08-03 18:06:51.587+08
52	1	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB4650-*o68ZqXw0d_G	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	54	2025-08-03 18:10:04.441+08
53	15	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-TnJWcnqREujR	172.21.77.185	27052	0	0	1211141357	started	qBittorrent/5.1.2	8	2025-08-03 18:14:00.927+08
54	1	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB4650-ENgmH448-Bd)	172.21.48.71	27633	436341349	0	0	update	qBittorrent/4.6.5	46	2025-08-03 18:29:38.435+08
55	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-0Lr8)sktg6Fb	172.21.77.185	27052	0	436341349	0	update	qBittorrent/5.1.2	47	2025-08-03 18:30:21.001+08
56	17	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-*XCa1.TU)hl8	172.21.134.69	33657	0	0	1024468230	update	qBittorrent/5.1.2	56	2025-08-03 18:36:46.747+08
57	17	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-L)_-lbQ7VTi!	172.21.134.69	33657	0	0	475829150	update	qBittorrent/5.1.2	7	2025-08-03 18:36:48.595+08
58	17	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-zWRVF8mzcGr0	172.21.134.69	33657	0	0	436341349	update	qBittorrent/5.1.2	7	2025-08-03 18:36:50.612+08
59	15	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-TnJWcnqREujR	172.21.77.185	27052	0	0	1211141357	stopped	qBittorrent/5.1.2	47	2025-08-03 18:38:52.407+08
60	15	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-TnJWcnqREujR	172.21.77.185	27052	0	0	1211141357	started	qBittorrent/5.1.2	6	2025-08-03 18:38:55.932+08
61	1	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB4650-*o68ZqXw0d_G	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	15	2025-08-03 18:40:04.322+08
62	1	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB4650-ENgmH448-Bd)	172.21.48.71	27633	436341349	0	0	update	qBittorrent/4.6.5	58	2025-08-03 18:59:38.456+08
63	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-0Lr8)sktg6Fb	172.21.77.185	27052	0	436341349	0	update	qBittorrent/5.1.2	53	2025-08-03 19:00:21.012+08
64	15	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-TnJWcnqREujR	172.21.77.185	27052	0	0	1211141357	update	qBittorrent/5.1.2	8	2025-08-03 19:08:55.895+08
65	1	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB4650-*o68ZqXw0d_G	172.21.48.71	27633	0	0	0	update	qBittorrent/4.6.5	47	2025-08-03 19:10:04.432+08
66	15	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-TnJWcnqREujR	172.21.77.185	27052	0	1211141357	0	completed	qBittorrent/5.1.2	58	2025-08-03 19:12:00.629+08
67	17	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-*XCa1.TU)hl8	172.21.134.69	33657	0	0	1024468230	started	qBittorrent/5.1.2	48	2025-08-03 19:13:09.122+08
68	17	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-L)_-lbQ7VTi!	172.21.134.69	33657	0	0	475829150	started	qBittorrent/5.1.2	9	2025-08-03 19:13:09.991+08
69	17	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-zWRVF8mzcGr0	172.21.134.69	33657	0	0	436341349	started	qBittorrent/5.1.2	10	2025-08-03 19:13:09.995+08
70	17	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-*XCa1.TU)hl8	172.21.134.69	33657	0	0	1024468230	stopped	qBittorrent/5.1.2	48	2025-08-03 19:13:31.394+08
71	17	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-zWRVF8mzcGr0	172.21.134.69	33657	0	0	436341349	stopped	qBittorrent/5.1.2	9	2025-08-03 19:13:32.416+08
72	17	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-L)_-lbQ7VTi!	172.21.134.69	33657	0	0	475829150	stopped	qBittorrent/5.1.2	8	2025-08-03 19:13:32.416+08
73	17	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-I(aM88kozUOg	172.21.134.69	33657	0	0	1211141357	started	qBittorrent/5.1.2	50	2025-08-03 19:13:59.423+08
74	17	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-I(aM88kozUOg	172.21.134.69	33657	0	1211141357	0	completed	qBittorrent/5.1.2	25	2025-08-03 19:16:06.981+08
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
6	1	13	0	0	220259	downloading	2025-08-01 21:55:23.596+08	\N	172.21.222.169	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-01 21:54:42.428+08	2025-08-01 21:55:23.596+08
7	15	14	0	0	475829150	downloading	\N	\N	172.21.77.185	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-01 23:25:44.127+08	2025-08-01 23:25:44.127+08
9	16	15	0	0	1024468230	downloading	\N	\N	172.23.234.194	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-01 23:43:38.769+08	2025-08-01 23:43:38.769+08
10	16	14	0	0	475829150	downloading	\N	\N	172.23.234.194	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-01 23:55:07.185+08	2025-08-01 23:55:07.185+08
8	15	15	0	0	1024468230	downloading	2025-08-03 16:14:37.28+08	\N	127.0.0.1	\N	axios/1.11.0	2025-08-01 23:31:49.111+08	2025-08-03 16:14:37.28+08
12	1	16	0	0	436341349	downloading	\N	\N	172.21.48.71	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 17:53:49.442+08	2025-08-03 17:53:49.442+08
13	15	16	0	0	436341349	downloading	\N	\N	172.21.77.185	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 17:57:21.575+08	2025-08-03 17:57:21.575+08
14	17	16	0	0	436341349	downloading	\N	\N	172.21.134.69	\N	Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36	2025-08-03 18:04:31.418+08	2025-08-03 18:04:31.418+08
15	17	14	0	0	475829150	downloading	\N	\N	172.21.134.69	\N	Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36	2025-08-03 18:05:43.446+08	2025-08-03 18:05:43.446+08
17	15	17	0	0	1211141357	downloading	\N	\N	172.21.77.185	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-03 18:13:51.737+08	2025-08-03 18:13:51.737+08
11	1	15	0	0	1024468230	downloading	2025-08-03 19:09:09.802+08	\N	127.0.0.1	\N	axios/1.11.0	2025-08-03 16:14:36.983+08	2025-08-03 19:09:09.802+08
16	17	15	0	0	1024468230	downloading	2025-08-03 19:09:10.019+08	\N	127.0.0.1	\N	axios/1.11.0	2025-08-03 18:05:51.854+08	2025-08-03 19:09:10.019+08
18	17	17	0	0	1211141357	downloading	\N	\N	172.21.134.69	\N	Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36	2025-08-03 19:13:41.398+08	2025-08-03 19:13:41.398+08
19	1	17	0	0	1211141357	downloading	\N	\N	127.0.0.1	\N	axios/1.11.0	2025-08-03 19:15:28.275+08	2025-08-03 19:15:28.275+08
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
19	17	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-I(aM88kozUOg	172.21.134.69	33657	0	1211141357	0	completed	qBittorrent/5.1.2	C330C180	2025-08-03 19:16:06.979+08	2025-08-03 19:13:59.418+08	2	2025-08-03 19:13:59.418+08	2025-08-03 19:16:06.979+08
2	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-TEST-123456789012	127.0.0.1	6881	0	0	100000	started	axios/1.11.0	\N	2025-08-01 22:51:00.705+08	2025-08-01 22:28:58.954+08	5	2025-08-01 22:28:58.954+08	2025-08-01 22:51:00.705+08
4	15	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB5120-T~q12AEzBrJY	172.21.77.185	27052	0	0	220259	started	qBittorrent/5.1.2	47FFCE41	2025-08-01 23:51:45.477+08	2025-08-01 22:56:41.688+08	6	2025-08-01 22:56:41.688+08	2025-08-01 23:51:45.477+08
3	1	13	529936d5fc5685f79981fdd060687f32fd75e528	-qB4650-q3OwApylNfKy	172.21.222.169	27633	0	0	0	started	qBittorrent/4.6.5	E4659457	2025-08-01 23:54:05.439+08	2025-08-01 22:54:05.451+08	3	2025-08-01 22:54:05.451+08	2025-08-01 23:54:05.439+08
5	1	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB4650-D6UmL7tr.rCf	172.21.222.169	27633	475829150	0	0	started	qBittorrent/4.6.5	CB9CC733	2025-08-01 23:55:22.44+08	2025-08-01 23:25:22.326+08	2	2025-08-01 23:25:22.326+08	2025-08-01 23:55:22.44+08
10	16	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-BXIooIV5HPY4	172.23.234.194	13761	0	475829150	0	completed	qBittorrent/5.1.2	67492DC5	2025-08-01 23:56:29.334+08	2025-08-01 23:55:48.093+08	2	2025-08-01 23:55:48.093+08	2025-08-01 23:56:29.334+08
6	15	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-yrRyNwpw5-XO	172.21.77.185	27052	0	475829150	0	completed	qBittorrent/5.1.2	88CA9657	2025-08-01 23:56:41.485+08	2025-08-01 23:25:56.387+08	3	2025-08-01 23:25:56.387+08	2025-08-01 23:56:41.485+08
9	16	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-ixj9_gdElsX~	172.23.234.194	13761	0	0	1024468230	started	qBittorrent/5.1.2	13A11A89	2025-08-01 23:56:42.406+08	2025-08-01 23:48:45.757+08	7	2025-08-01 23:48:45.757+08	2025-08-01 23:56:42.406+08
7	1	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB4650-2!sY45bQ0YE_	172.21.222.169	27633	1024468230	0	0	started	qBittorrent/4.6.5	7B00B7C4	2025-08-02 00:01:54.316+08	2025-08-01 23:31:54.318+08	2	2025-08-01 23:31:54.318+08	2025-08-02 00:01:54.316+08
8	15	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-byLx59lmcQ0e	172.21.77.185	27052	0	1024468230	0	completed	qBittorrent/5.1.2	FB3A821F	2025-08-02 00:03:32.504+08	2025-08-01 23:31:55.544+08	3	2025-08-01 23:31:55.544+08	2025-08-02 00:03:32.504+08
11	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-i8fB53Uns-E0	172.21.77.185	27052	0	0	436341349	stopped	qBittorrent/5.1.2	D9FB4D20	2025-08-03 17:58:07.403+08	2025-08-03 17:57:31.779+08	2	2025-08-03 17:57:31.779+08	2025-08-03 17:58:07.404+08
13	1	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB4650-ENgmH448-Bd)	172.21.48.71	27633	436341349	0	0	started	qBittorrent/4.6.5	36AEADA2	2025-08-03 18:59:38.454+08	2025-08-03 17:59:38.434+08	3	2025-08-03 17:59:38.434+08	2025-08-03 18:59:38.455+08
12	15	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-0Lr8)sktg6Fb	172.21.77.185	27052	0	436341349	0	completed	qBittorrent/5.1.2	6DB91F77	2025-08-03 19:00:21.01+08	2025-08-03 17:58:17.091+08	5	2025-08-03 17:58:17.091+08	2025-08-03 19:00:21.01+08
17	1	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB4650-*o68ZqXw0d_G	172.21.48.71	27633	0	0	0	started	qBittorrent/4.6.5	135D6A5A	2025-08-03 19:10:04.431+08	2025-08-03 18:10:04.435+08	3	2025-08-03 18:10:04.435+08	2025-08-03 19:10:04.431+08
18	15	17	a956b69fdd5bef598a7c1975d7d4673631fe2d81	-qB5120-TnJWcnqREujR	172.21.77.185	27052	0	1211141357	0	completed	qBittorrent/5.1.2	ECE13D22	2025-08-03 19:12:00.626+08	2025-08-03 18:14:00.924+08	5	2025-08-03 18:14:00.924+08	2025-08-03 19:12:00.626+08
16	17	15	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	-qB5120-*XCa1.TU)hl8	172.21.134.69	33657	0	0	1024468230	stopped	qBittorrent/5.1.2	49A43261	2025-08-03 19:13:31.393+08	2025-08-03 18:06:06.079+08	6	2025-08-03 18:06:06.079+08	2025-08-03 19:13:31.393+08
14	17	16	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	-qB5120-zWRVF8mzcGr0	172.21.134.69	33657	0	0	436341349	stopped	qBittorrent/5.1.2	6709102C	2025-08-03 19:13:32.414+08	2025-08-03 18:05:00.914+08	6	2025-08-03 18:05:00.915+08	2025-08-03 19:13:32.414+08
15	17	14	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	-qB5120-L)_-lbQ7VTi!	172.21.134.69	33657	0	0	475829150	stopped	qBittorrent/5.1.2	DC74768E	2025-08-03 19:13:32.415+08	2025-08-03 18:06:01.971+08	6	2025-08-03 18:06:01.971+08	2025-08-03 19:13:32.415+08
\.


--
-- Data for Name: torrents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.torrents (id, name, description, info_hash, size, file_count, uploader_id, category_id, status, seeders, leechers, completed, torrent_file, nfo_file, image_files, tags, free_leech, double_upload, free_leech_until, created_at, updated_at, review_reason, reviewed_by, reviewed_at) FROM stdin;
13	tracker-test-torrent	第一次tracker测试用种子	529936d5fc5685f79981fdd060687f32fd75e528	220259	1	1	8	approved	0	1	0	1754056471718-a6898c6231b8d785.torrent	\N	[]	[]	f	f	\N	2025-08-01 21:54:31.736+08	2025-08-01 21:54:42.454+08	\N	1	2025-08-01 21:54:38.676+08
8	srdsfs	gagag	f99551eeb21c6524b8a9920dc88d03943a683791	2347894659	1	1	8	rejected	0	0	0	1753970970893-eeb1962c6fbafddf.torrent	\N	[]	[]	f	f	\N	2025-07-31 22:09:30.903+08	2025-08-03 17:50:24.4+08	1	1	2025-08-03 17:50:24.4+08
16	败犬女主太多了第二集	测试用种子	6c26d32bc8d4d3c8205f4075a8588ceec8fea24d	436341349	1	1	2	approved	0	3	0	1754214818436-e9d67d3056c78e20.torrent	\N	[]	[]	f	f	\N	2025-08-03 17:53:38.46+08	2025-08-03 18:04:31.437+08	\N	1	2025-08-03 17:53:44.155+08
14	tracker-test-torrent-large	测试用的动画种子	e2119cc3b22045d2d5d5ddb91c058c774ed5b3e8	475829150	1	1	2	approved	0	3	0	1754061897884-82603930b628e77b.torrent	\N	[]	[]	f	f	\N	2025-08-01 23:24:57.909+08	2025-08-03 18:05:43.462+08	\N	1	2025-08-01 23:25:11.044+08
15	忍者杀手第一集	测试用的动画种子	125b5a001c63e094aab4ff6e7e7ef0973ce15be8	1024468230	1	1	2	approved	0	4	0	1754062279178-4d50ac0e22bb4969.torrent	\N	[]	[]	f	f	\N	2025-08-01 23:31:19.199+08	2025-08-03 18:05:51.862+08	\N	1	2025-08-01 23:31:29.938+08
17	忍者杀手第二集	测试用种子	a956b69fdd5bef598a7c1975d7d4673631fe2d81	1211141357	1	1	2	approved	0	3	0	1754215785301-3ea5d355269d2200.torrent	\N	[]	[]	f	f	\N	2025-08-03 18:09:45.321+08	2025-08-03 19:15:28.283+08	\N	1	2025-08-03 18:09:52.411+08
\.


--
-- Data for Name: user_passkeys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_passkeys (id, user_id, passkey, active, last_used, created_at, updated_at) FROM stdin;
2	2	edf6aa9988278abb11a63fa868696e19	t	\N	2025-07-30 18:14:30.726+08	2025-07-30 18:14:30.727+08
1	1	3c7ac6a8f6f28624698ce65a52f4fe61	t	2025-08-03 19:10:04.418+08	2025-07-30 18:12:13.771+08	2025-08-03 19:10:04.418+08
15	15	9a5c1a8ea23d8b92a21ecca8751f873f	t	2025-08-03 19:12:00.612+08	2025-08-01 21:44:25.1+08	2025-08-03 19:12:00.612+08
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
16	16	46d5726891815e99a28bbaabd8d7543d	t	2025-08-01 23:56:42.402+08	2025-08-01 23:43:38.793+08	2025-08-01 23:56:42.402+08
\.


--
-- Data for Name: user_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_stats (id, user_id, uploaded, downloaded, seedtime, leechtime, bonus_points, invitations, torrents_uploaded, torrents_seeding, torrents_leeching, created_at, updated_at) FROM stdin;
15	15	0	3147780086	0	0	50.00	0	0	0	4	2025-08-01 21:20:40.575+08	2025-08-03 19:12:00.628+08
1	1	1936638729	0	0	0	0.00	0	12	0	8	2025-07-30 14:00:19.718+08	2025-08-03 19:15:28.283+08
17	17	0	1211141357	0	0	50.00	0	0	0	8	2025-08-03 18:03:20.604+08	2025-08-03 19:16:06.981+08
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
16	16	0	475829150	0	0	50.00	0	0	0	2	2025-08-01 23:43:23.917+08	2025-08-01 23:56:29.336+08
2	2	0	0	0	0	0.00	0	0	0	0	2025-07-30 14:00:19.914+08	2025-08-02 00:00:00.842+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, role, status, avatar, invitation_code, invited_by, last_login, registration_ip, created_at, updated_at) FROM stdin;
13	testuser527859	test1754044527859@example.com	$2b$12$81ZqUud1Aty.NuN6ByoTQeInEHgaNlsFPwb9t/K5Fby96R3r/rpsC	user	active	\N	\N	\N	2025-08-01 18:35:28.411+08	127.0.0.1	2025-08-01 18:35:28.007+08	2025-08-01 18:35:28.412+08
14	testuser578054	test1754044578054@example.com	$2b$12$UJaJJuuuB8kPGzQ2mvACZOODtwPZsb.kj750guHLg18rkBdD/ghNK	user	active	\N	\N	\N	2025-08-01 18:36:18.598+08	127.0.0.1	2025-08-01 18:36:18.193+08	2025-08-01 18:36:18.598+08
6	user10	kevin655362333@gmail.com	$2b$12$XwpUY4.XRJgrO8gxZd7gJO7c1BIQKffmTVBuSHmN44aLIMvkpP4oW	user	active	\N	\N	\N	\N	::1	2025-07-31 23:36:48.823+08	2025-07-31 23:36:48.823+08
4	user1	qdsxhkw@126.com	$2b$12$u57cQBe6hiMFPuo44K917e9HtS0jhZGpmRF9RFhmzmXa4V4BBxIw6	user	active	\N	\N	\N	2025-07-31 23:42:47.361+08	::1	2025-07-31 23:33:10.732+08	2025-07-31 23:42:47.362+08
16	April	1320356075@qq.com	$2b$12$nRLAdBBwkcLUHDM.PJW.sOHUNoqHqHRq7KO22kjNuy0T.1fwiFN8S	user	active	\N	\N	\N	\N	172.23.234.194	2025-08-01 23:43:23.716+08	2025-08-01 23:43:23.716+08
3	newuser2025	newuser2025@example.com	$2b$12$E64A7URuU/owHKEwU48w3.cRTLZ8RFi/5KWNSs8irdv9/9lNnGZ5W	user	banned	\N	\N	\N	\N	::1	2025-07-31 23:29:56.868+08	2025-08-01 17:36:53.946+08
5	testuser2025	testuser2025@126.com	$2b$12$VObZVXeW00bDfjJTQcXkY.FoYTgxNRFJmoQVGOtN24GEm04gHQLw6	user	inactive	\N	\N	\N	\N	::1	2025-07-31 23:36:13.999+08	2025-08-01 17:37:01.855+08
2	testuser	test@pt.local	$2b$12$xPgiA56CJ.PkLNqjE8VGEeu1wgaGQesrydnv2rBUojherJkmunQvi	user	active	\N	\N	\N	2025-08-01 18:04:14.171+08	\N	2025-07-30 14:00:19.726+08	2025-08-01 18:04:14.171+08
17	507pc1	QDSXhkw@163.com	$2b$12$ggHEalYRgKkx/.BsaFMTlesnz6ibrwaHykXa5Ckkcff.EYJo0E9xC	user	active	\N	\N	\N	2025-08-03 19:09:10.003+08	172.21.134.69	2025-08-03 18:03:20.391+08	2025-08-03 19:09:10.003+08
7	testuser999128	test1754043999128@example.com	$2b$12$V5wAPn7CCSnR.diIsLouFe/sCM3PA5HFNhciq9gXUI1BxXwwvSh12	user	active	\N	\N	\N	2025-08-01 18:26:39.684+08	127.0.0.1	2025-08-01 18:26:39.258+08	2025-08-01 18:26:39.684+08
8	testuser019877	test1754044019877@example.com	$2b$12$JWNAUyWhJ1Fp02qlRcL6I.Rs7/nlXVXQ.Z.xqFmus2xCuk1SwcW7K	user	active	\N	\N	\N	2025-08-01 18:27:00.41+08	127.0.0.1	2025-08-01 18:27:00.008+08	2025-08-01 18:27:00.41+08
9	testuser054545	test1754044054545@example.com	$2b$12$9fkpUKlOoy5yCORONk9MTuCQnJVLAPsIFVxX0C2ho5on4ie.7nFVa	user	active	\N	\N	\N	2025-08-01 18:27:35.073+08	127.0.0.1	2025-08-01 18:27:34.674+08	2025-08-01 18:27:35.073+08
10	testuser101201	test1754044101201@example.com	$2b$12$Z.ugecUkjoiq.8.I4OMFYOSA/CgqxP3pRKty8KpIen1DJZYfaaylK	user	active	\N	\N	\N	2025-08-01 18:28:21.758+08	127.0.0.1	2025-08-01 18:28:21.352+08	2025-08-01 18:28:21.759+08
11	testuser131518	test1754044131518@example.com	$2b$12$2N4MsOEwoWAuAkr0RH9zr.Jo7RehArKpuP/.q3wEFu0hsCwK6SwkC	user	active	\N	\N	\N	2025-08-01 18:28:52.063+08	127.0.0.1	2025-08-01 18:28:51.655+08	2025-08-01 18:28:52.063+08
12	testuser392105	test1754044392105@example.com	$2b$12$GFSbt/NwXhRwEf8xWfVngeB2xcR9lNorV5lk35j.bxTO4dU.60Lye	user	active	\N	\N	\N	2025-08-01 18:33:12.643+08	127.0.0.1	2025-08-01 18:33:12.238+08	2025-08-01 18:33:12.643+08
1	admin	admin@pt.local	$2b$12$fpiJktCkj1f0LVKrgl8U3.rkxN8gahXpErOb6iMZ027mvdfv.p1K2	admin	active	\N	\N	\N	2025-08-03 19:15:28.222+08	\N	2025-07-30 14:00:19.525+08	2025-08-03 19:15:28.222+08
15	testuser1	duanlf2023@lzu.edu.cn	$2b$12$qx72ElO8XEMu8ZMeiYidbuGWwzWGC3pXvmPuzQHJSV48sx35oy9V6	user	active	\N	\N	\N	2025-08-03 17:57:14.319+08	172.21.77.185	2025-08-01 21:20:40.365+08	2025-08-03 17:57:14.32+08
\.


--
-- Name: announce_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announce_logs_id_seq', 74, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.downloads_id_seq', 19, true);


--
-- Name: info_hash_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.info_hash_variants_id_seq', 13, true);


--
-- Name: peers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.peers_id_seq', 19, true);


--
-- Name: torrents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.torrents_id_seq', 17, true);


--
-- Name: user_passkeys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_passkeys_id_seq', 17, true);


--
-- Name: user_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_stats_id_seq', 17, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


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
-- Name: categories categories_name_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key9 UNIQUE (name);


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
-- Name: torrents torrents_info_hash_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.torrents
    ADD CONSTRAINT torrents_info_hash_key9 UNIQUE (info_hash);


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
-- Name: user_passkeys user_passkeys_passkey_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_passkeys
    ADD CONSTRAINT user_passkeys_passkey_key9 UNIQUE (passkey);


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
-- Name: users users_email_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key9 UNIQUE (email);


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
-- Name: users users_invitation_code_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invitation_code_key9 UNIQUE (invitation_code);


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
-- Name: users users_username_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key9 UNIQUE (username);


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

